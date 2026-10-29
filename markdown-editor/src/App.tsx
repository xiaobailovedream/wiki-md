import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import type { EditorView } from '@codemirror/view'
import { renderMarkdown } from './lib/markdown'
import { listDocs, createDoc, saveDoc, deleteDoc, getDoc, addAttachment, listAttachments, listFolders, createFolder, renameFolder, deleteFolder, type Doc, type Folder, type Attachment } from './lib/storage'
import { exportMarkdown, exportHtml, exportPdf, exportDocx } from './lib/export'
import './App.css'

const MAX_INLINE_IMAGE = 2 * 1024 * 1024 // 2MB，内嵌上限

type ViewMode = 'edit' | 'split' | 'preview'

interface DocItemProps {
  doc: Doc
  active: boolean
  onSelect: () => void
  onDelete: () => void
  onMove: (folderId: string | null) => void
  folders: Folder[]
}

function DocItem({ doc, active, onSelect, onDelete, onMove, folders }: DocItemProps) {
  const [moveOpen, setMoveOpen] = useState(false)

  return (
    <li className={active ? 'doc-item active' : 'doc-item'} onClick={onSelect}>
      <span className="doc-icon">📄</span>
      <span className="doc-title">{doc.title || '无标题'}</span>
      <div className="doc-ops" onClick={(e) => e.stopPropagation()}>
        <div className="move-wrap">
          <button className="doc-op" title="移动到文件夹" onClick={() => setMoveOpen((v) => !v)}>
            🗁
          </button>
          {moveOpen && (
            <div className="move-menu">
              <button
                className="move-item"
                onClick={() => {
                  onMove(null)
                  setMoveOpen(false)
                }}
              >
                根目录
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  className="move-item"
                  onClick={() => {
                    onMove(f.id)
                    setMoveOpen(false)
                  }}
                >
                  {f.name}
                </button>
              ))}
              {folders.length === 0 && <div className="move-empty">暂无文件夹，先在侧栏新建</div>}
            </div>
          )}
        </div>
        <button className="doc-op doc-del" title="删除" onClick={onDelete}>
          ×
        </button>
      </div>
    </li>
  )
}

interface FolderRowProps {
  folder: Folder
  docs: Doc[]
  expanded: boolean
  currentId: string | null
  onToggle: () => void
  onNewDoc: () => void
  onRename: () => void
  onDelete: () => void
  onSelectDoc: (id: string) => void
  onDeleteDoc: (id: string) => void
  onMoveDoc: (docId: string, folderId: string | null) => void
  folders: Folder[]
}

function FolderRow({ folder, docs, expanded, currentId, onToggle, onNewDoc, onRename, onDelete, onSelectDoc, onDeleteDoc, onMoveDoc, folders }: FolderRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const folderDocs = docs.filter((d) => d.folderId === folder.id)

  return (
    <div className="folder">
      <div className="folder-head" onClick={onToggle}>
        <span className="caret-btn">{expanded ? '▾' : '▸'}</span>
        <span className="folder-name">{folder.name}</span>
        <span className="folder-ops" onClick={(e) => e.stopPropagation()}>
          <button className="folder-op" title="在此文件夹中新建文档" onClick={onNewDoc}>＋</button>
          <div className="folder-menu-wrap" ref={menuRef}>
            <button className="folder-op" title="更多" onClick={() => setMenuOpen((v) => !v)}>⋯</button>
            {menuOpen && (
              <div className="move-menu folder-menu">
                <button
                  className="move-item"
                  onClick={() => {
                    setMenuOpen(false)
                    onRename()
                  }}
                >
                  重命名
                </button>
                <button
                  className="move-item danger"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete()
                  }}
                >
                  删除
                </button>
              </div>
            )}
          </div>
        </span>
      </div>
      {expanded && (
        folderDocs.length === 0 ? (
          <div className="folder-empty">暂无子页面</div>
        ) : (
          <ul className="doc-list sub">
            {folderDocs.map((d) => (
              <DocItem
                key={d.id}
                doc={d}
                active={d.id === currentId}
                onSelect={() => onSelectDoc(d.id)}
                onDelete={() => onDeleteDoc(d.id)}
                onMove={(target) => onMoveDoc(d.id, target)}
                folders={folders}
              />
            ))}
          </ul>
        )
      )}
    </div>
  )
}

export default function App() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [attachMode, setAttachMode] = useState<'inline' | 'link'>('inline')
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const saveTimer = useRef<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const mdInput = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const cmRef = useRef<ReactCodeMirrorRef>(null)
  const editorView = useRef<EditorView | null>(null)
  const headingLevel = useRef(0)

  const current = useMemo(() => (currentId ? getDoc(currentId) : undefined), [currentId, docs])

  useEffect(() => {
    const list = listDocs()
    setDocs(list)
    setFolders(listFolders())
    setAttachments(listAttachments())
    if (list.length > 0) setCurrentId(list[0].id)
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleNew = useCallback(() => {
    const doc = createDoc()
    setDocs(listDocs())
    setCurrentId(doc.id)
  }, [])

  const handleNewFolder = useCallback(() => {
    const name = window.prompt('请输入文件夹名称：', '新建文件夹')
    if (!name) return
    createFolder(name.trim() || '新建文件夹')
    setFolders(listFolders())
  }, [])

  const handleNewInFolder = useCallback((folderId: string) => {
    const doc = createDoc('无标题', folderId)
    setDocs(listDocs())
    setCurrentId(doc.id)
    setExpandedFolders((prev) => new Set(prev).add(folderId))
  }, [])

  const handleRenameFolder = useCallback((id: string, current: string) => {
    const name = window.prompt('重命名文件夹：', current)
    if (!name) return
    renameFolder(id, name.trim() || current)
    setFolders(listFolders())
  }, [])

  const handleDeleteFolder = useCallback((id: string) => {
    if (!window.confirm('确认删除该文件夹？文件夹内的文档会移回根目录，不会被删除。')) return
    deleteFolder(id)
    setFolders(listFolders())
    setDocs(listDocs())
  }, [])

  const handleMoveToFolder = useCallback((docId: string, folderId: string | null) => {
    saveDoc(docId, { folderId })
    setDocs(listDocs())
  }, [])

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // 导入 .md 文件
  const handleImportMd = useCallback(() => {
    mdInput.current?.click()
  }, [])

  const handleMdFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.md') && !file.name.toLowerCase().endsWith('.markdown')) continue
      const reader = new FileReader()
      reader.onload = () => {
        const content = String(reader.result ?? '')
        const title = file.name.replace(/\.(md|markdown)$/i, '')
        const doc = createDoc(title)
        saveDoc(doc.id, { content })
        setDocs(listDocs())
        setCurrentId(doc.id)
      }
      reader.readAsText(file, 'utf-8')
    }
  }, [])

  const handleContentChange = useCallback(
    (content: string) => {
      if (!currentId) return
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        saveDoc(currentId, { content })
        setDocs(listDocs())
        setSavedAt(Date.now())
      }, 600)
    },
    [currentId]
  )

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!currentId) return
      saveDoc(currentId, { title })
      setDocs(listDocs())
    },
    [currentId]
  )

  const handleDelete = useCallback((id: string) => {
    if (!window.confirm('确认删除这篇文档？此操作不可恢复。')) return
    deleteDoc(id)
    const rest = listDocs()
    setDocs(rest)
    setCurrentId(rest.length > 0 ? rest[0].id : null)
  }, [])

  const handleImagePaste = useCallback(
    (files: File[]) => {
      if (!currentId || files.length === 0) return
      const file = files[0]
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        if (attachMode === 'inline') {
          if (file.size > MAX_INLINE_IMAGE) {
            alert(`图片超过 2MB，内嵌模式会显著增大文档体积。建议切换为「外链」模式或压缩后再插入。`)
            return
          }
          const doc = getDoc(currentId)
          if (doc) {
            const md = `![${file.name}](${dataUrl})`
            const updated = doc.content ? doc.content + '\n\n' + md : md
            saveDoc(currentId, { content: updated })
            setDocs(listDocs())
          }
        } else {
          const id = crypto.randomUUID()
          addAttachment({ id, name: file.name, size: file.size, type: file.type, dataUrl })
          setAttachments(listAttachments())
          const doc = getDoc(currentId)
          if (doc) {
            const md = `![${file.name}](${dataUrl})`
            const updated = doc.content ? doc.content + '\n\n' + md : md
            saveDoc(currentId, { content: updated })
            setDocs(listDocs())
          }
        }
      }
      reader.readAsDataURL(file)
    },
    [currentId, attachMode]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? [])
      const imgItem = items.find((i) => i.type.startsWith('image/'))
      if (imgItem) {
        const file = imgItem.getAsFile()
        if (file) {
          e.preventDefault()
          handleImagePaste([file])
        }
      }
    },
    [handleImagePaste]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      handleImagePaste(files)
    },
    [handleImagePaste]
  )

  const handleFilePick = useCallback(() => {
    if (!currentId) return
    setMenuOpen(false)
    fileInput.current?.click()
  }, [currentId])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      handleImagePaste(files)
      e.target.value = ''
    },
    [handleImagePaste]
  )

  const extensions = useMemo(() => [markdown({ base: markdownLanguage, codeLanguages: languages })], [])

  const handleCreateEditor = useCallback((view: EditorView) => {
    editorView.current = view
  }, [])

  // 在光标处插入 Markdown 语法（选中文本则包裹）
  const insertAtCursor = useCallback(
    (before: string, after = '') => {
      const view = editorView.current
      if (!view) return
      const { from, to } = view.state.selection.main
      const selected = view.state.sliceDoc(from, to)
      const insertText = before + selected + after
      view.dispatch({
        changes: { from, to, insert: insertText },
        selection: { anchor: from + before.length + selected.length }
      })
      view.focus()
    },
    []
  )

  const wrapSelection = useCallback(
    (prefix: string, suffix = prefix) => insertAtCursor(prefix, suffix),
    [insertAtCursor]
  )

  const insertLinePrefix = useCallback(
    (prefix: string) => {
      const view = editorView.current
      if (!view) return
      const { from } = view.state.selection.main
      const lineStart = view.state.doc.lineAt(from).from
      view.dispatch({
        changes: { from: lineStart, insert: prefix },
        selection: { anchor: lineStart + prefix.length }
      })
      view.focus()
    },
    []
  )

  // 顶部工具栏：分组格式项（灰色线性图标，Cmd Markdown 风）
  const insertHeading = useCallback(() => {
    const view = editorView.current
    if (!view) return
    headingLevel.current = (headingLevel.current % 3) + 1
    const { from } = view.state.selection.main
    const line = view.state.doc.lineAt(from)
    const stripped = line.text.replace(/^#{1,6}\s*/, '')
    const prefix = '#'.repeat(headingLevel.current) + ' '
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from + (line.text.length - stripped.length),
        insert: prefix
      },
      selection: { anchor: line.from + prefix.length }
    })
    view.focus()
  }, [])

  const insertLink = useCallback(() => {
    const url = window.prompt('请输入链接地址：', 'https://')
    if (!url) return
    insertAtCursor('[', `](${url})`)
  }, [insertAtCursor])

  const svg = (paths: string) =>
    `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`

  const toolbarGroups: { label: string; title: string; icon?: string; text?: string; run: () => void }[][] = useMemo(
    () => [
      [
        { label: 'bold', title: '加粗', text: '<b>B</b>', run: () => wrapSelection('**') },
        { label: 'italic', title: '斜体', text: '<i>I</i>', run: () => wrapSelection('*') },
        { label: 'strike', title: '删除线', text: '<s>S</s>', run: () => wrapSelection('~~') }
      ],
      [
        { label: 'heading', title: '标题（点击循环 H1→H2→H3）', text: '<b>H▾</b>', run: insertHeading }
      ],
      [
        { label: 'hr', title: '分隔线', icon: svg('<line x1="2.5" y1="8" x2="13.5" y2="8"/>'), run: () => insertAtCursor('\n---\n') },
        { label: 'quote', title: '引用', text: '<span style="font-family:Georgia,serif;font-weight:600">“</span>', run: () => insertLinePrefix('> ') }
      ],
      [
        {
          label: 'ul',
          title: '无序列表',
          icon: svg(
            '<circle cx="3" cy="4" r="0.9" fill="currentColor" stroke="none"/><line x1="6" y1="4" x2="13.5" y2="4"/>' +
            '<circle cx="3" cy="8" r="0.9" fill="currentColor" stroke="none"/><line x1="6" y1="8" x2="13.5" y2="8"/>' +
            '<circle cx="3" cy="12" r="0.9" fill="currentColor" stroke="none"/><line x1="6" y1="12" x2="13.5" y2="12"/>'
          ),
          run: () => insertLinePrefix('- ')
        },
        {
          label: 'ol',
          title: '有序列表',
          icon: svg(
            '<text x="1.5" y="6" font-size="5" fill="currentColor" stroke="none" font-family="sans-serif">1</text><line x1="6" y1="4" x2="13.5" y2="4"/>' +
            '<text x="1.5" y="10.5" font-size="5" fill="currentColor" stroke="none" font-family="sans-serif">2</text><line x1="6" y1="8.5" x2="13.5" y2="8.5"/>' +
            '<text x="1.5" y="15" font-size="5" fill="currentColor" stroke="none" font-family="sans-serif">3</text><line x1="6" y1="13" x2="13.5" y2="13"/>'
          ),
          run: () => insertLinePrefix('1. ')
        },
        {
          label: 'todo',
          title: '待办事项',
          icon: svg('<rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8l2 2 4-4"/>'),
          run: () => insertLinePrefix('- [ ] ')
        }
      ],
      [
        { label: 'link', title: '链接', icon: svg('<path d="M6.8 9.2l2.4-2.4"/><path d="M7.5 5.2L9 3.7a2.4 2.4 0 013.4 3.4l-1.5 1.5"/><path d="M8.5 10.8L7 12.3a2.4 2.4 0 01-3.4-3.4l1.5-1.5"/>'), run: insertLink },
        { label: 'image', title: '插入图片（上传）', icon: svg('<rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><circle cx="5.5" cy="6" r="1.1"/><path d="M3.5 12l3.2-3.2 2.3 2.3 1.8-1.8 2.2 2.2"/>'), run: handleFilePick },
        { label: 'code', title: '代码块', icon: svg('<path d="M5.5 4L2 8l3.5 4"/><path d="M10.5 4L14 8l-3.5 4"/>'), run: () => insertAtCursor('```\n', '\n```') },
        { label: 'table', title: '表格', icon: svg('<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><line x1="1.5" y1="8" x2="14.5" y2="8"/><line x1="8" y1="2.5" x2="8" y2="13.5"/>'), run: () => insertAtCursor('\n| 列1 | 列2 |\n| --- | --- |\n| 内容 | 内容 |\n') }
      ]
    ],
    [wrapSelection, insertHeading, insertAtCursor, insertLinePrefix, insertLink, handleFilePick, svg]
  )

  return (
    <div className="app">
      {/* 左侧边栏 */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-top">
          <div className="workspace">
            <span className="ws-avatar">M</span>
            <span className="ws-name">我的工作区</span>
          </div>
        </div>
        <div className="sidebar-section">
          <div className="section-label">文档</div>
          <div className="nav-actions">
            <button className="nav-new" onClick={handleNew}>
              <span className="plus">＋</span> 新建文档
            </button>
            <button className="nav-new" onClick={handleNewFolder}>
              <span className="plus">🗀</span> 新建文件夹
            </button>
            <button className="nav-new" onClick={handleImportMd}>
              <span className="plus">⇪</span> 导入 md
            </button>
          </div>
          <input ref={mdInput} type="file" accept=".md,.markdown,text/markdown" multiple style={{ display: 'none' }} onChange={handleMdFileChange} />

          {/* 文件夹树（Notion 风） */}
          {folders.map((f) => (
            <FolderRow
              key={f.id}
              folder={f}
              docs={docs}
              expanded={expandedFolders.has(f.id)}
              currentId={currentId}
              onToggle={() => toggleFolder(f.id)}
              onNewDoc={() => handleNewInFolder(f.id)}
              onRename={() => handleRenameFolder(f.id, f.name)}
              onDelete={() => handleDeleteFolder(f.id)}
              onSelectDoc={setCurrentId}
              onDeleteDoc={handleDelete}
              onMoveDoc={handleMoveToFolder}
              folders={folders}
            />
          ))}

          {/* 根目录文档 */}
          {docs.filter((d) => !d.folderId).map((d) => (
            <DocItem key={d.id} doc={d} active={d.id === currentId} onSelect={() => setCurrentId(d.id)} onDelete={() => handleDelete(d.id)} onMove={(target) => handleMoveToFolder(d.id, target)} folders={folders} />
          ))}
          {docs.length === 0 && <div className="empty-hint">暂无文档，点击「新建文档」开始</div>}
        </div>
        {attachments.length > 0 && (
          <div className="sidebar-section attachments">
            <div className="section-label">附件</div>
            <ul>
              {attachments.map((a) => (
                <li key={a.id}>
                  <a href={a.dataUrl} download={a.name} title={`${a.name} (${(a.size / 1024).toFixed(1)}KB)`}>
                    <span className="doc-icon">📎</span>
                    <span className="att-name">{a.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="sidebar-footer">
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="main" onPaste={handlePaste} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        {current ? (
          <>
            {/* 顶栏：面包屑 + 操作 */}
            <header className="topbar">
              <div className="breadcrumb">
                <span className="crumb">我的工作区</span>
                <span className="crumb-sep">/</span>
                <span className="crumb current">{current.title || '无标题'}</span>
              </div>
              <div className="topbar-actions">
                <span className="save-hint">
                  {savedAt ? `已保存 ${new Date(savedAt).toLocaleTimeString('zh-CN')}` : '自动保存中'}
                </span>
                <div className="menu-wrap" ref={menuRef}>
                  <button className="more-btn" onClick={() => setMenuOpen((v) => !v)} title="更多操作">
                    ⋯
                  </button>
                  {menuOpen && (
                    <div className="dropdown">
                      <div className="dropdown-group">
                        <div className="dropdown-label">视图</div>
                        {(['edit', 'split', 'preview'] as ViewMode[]).map((m) => (
                          <button
                            key={m}
                            className={`dropdown-item ${viewMode === m ? 'active' : ''}`}
                            onClick={() => {
                              setViewMode(m)
                              setMenuOpen(false)
                            }}
                          >
                            {m === 'edit' ? '仅编辑' : m === 'split' ? '分栏（编辑+预览）' : '仅预览'}
                          </button>
                        ))}
                      </div>
                      <div className="dropdown-group">
                        <div className="dropdown-label">图片插入方式</div>
                        <button
                          className={`dropdown-item ${attachMode === 'inline' ? 'active' : ''}`}
                          onClick={() => {
                            setAttachMode('inline')
                            setMenuOpen(false)
                          }}
                        >
                          内嵌（base64）
                        </button>
                        <button
                          className={`dropdown-item ${attachMode === 'link' ? 'active' : ''}`}
                          onClick={() => {
                            setAttachMode('link')
                            setMenuOpen(false)
                          }}
                        >
                          外链（存入附件库）
                        </button>
                      </div>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item" onClick={handleFilePick}>上传图片 / 附件</button>
                      <div className="dropdown-divider" />
                      <div className="dropdown-label">导出</div>
                      <div className="dropdown-export">
                        <button className="export-btn" onClick={() => exportMarkdown(current.title, current.content)}>Markdown</button>
                        <button className="export-btn" onClick={() => exportHtml(current.title, current.content)}>HTML</button>
                        <button className="export-btn" onClick={() => exportPdf(current.title, current.content)}>PDF</button>
                        <button className="export-btn" onClick={() => exportDocx(current.title, current.content)}>DOCX</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <input
                ref={fileInput}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </header>

            {/* 编辑工具栏：通栏固定在顶部（Cmd Markdown 风） */}
            {viewMode !== 'preview' && (
              <div className="editor-toolbar">
                {toolbarGroups.map((group, gi) => (
                  <div className="tb-group" key={gi}>
                    {group.map((a) => (
                      <button
                        key={a.label}
                        className="fmt-btn"
                        title={a.title}
                        onClick={a.run}
                        dangerouslySetInnerHTML={{ __html: a.icon ?? a.text ?? '' }}
                      />
                    ))}
                    {gi < toolbarGroups.length - 1 && <span className="tb-sep" />}
                  </div>
                ))}
              </div>
            )}

            {/* 文档正文 */}
            <div className="page-scroll">
              <div className="page">
                <input
                  className="title-input"
                  value={current.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="无标题"
                />
                <div className={`editor-area mode-${viewMode}`}>
                  {viewMode !== 'preview' && (
                    <div className="editor-pane">
                      <CodeMirror
                        ref={cmRef}
                        value={current.content}
                        onChange={handleContentChange}
                        onCreateEditor={handleCreateEditor}
                        extensions={extensions}
                        height="100%"
                        theme="light"
                        basicSetup={{
                          lineNumbers: false,
                          foldGutter: false,
                          highlightActiveLine: false,
                          highlightActiveLineGutter: false,
                          autocompletion: false
                        }}
                        placeholder="输入正文，支持粘贴 / 拖拽上传图片…"
                      />
                    </div>
                  )}
                  {viewMode !== 'edit' && (
                    <div
                      className="preview-pane markdown-body"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(current.content) }}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="welcome">
            <div className="welcome-card">
              <h1>欢迎使用 Markdown 协作平台</h1>
              <p>支持编辑、自动保存、图片附件上传，以及 MD / HTML / PDF / DOCX 导出。</p>
              <button className="btn-primary" onClick={handleNew}>新建第一篇文档</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
