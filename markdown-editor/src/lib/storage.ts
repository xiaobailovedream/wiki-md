export interface Doc {
  id: string
  title: string
  content: string
  folderId: string | null
  createdAt: number
  updatedAt: number
}

export interface Folder {
  id: string
  name: string
  createdAt: number
}

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string
}

const DOCS_KEY = 'mde:docs'
const FOLDERS_KEY = 'mde:folders'
const ATTACH_KEY = 'mde:attachments'

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function listDocs(): Doc[] {
  return readJSON<Doc[]>(DOCS_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getDoc(id: string): Doc | undefined {
  return listDocs().find((d) => d.id === id)
}

export function createDoc(title = '无标题文档', folderId: string | null = null): Doc {
  const now = Date.now()
  const doc: Doc = {
    id: crypto.randomUUID(),
    title,
    content: '',
    folderId,
    createdAt: now,
    updatedAt: now
  }
  const docs = listDocs()
  docs.unshift(doc)
  writeJSON(DOCS_KEY, docs)
  return doc
}

export function saveDoc(id: string, patch: Partial<Pick<Doc, 'title' | 'content' | 'folderId'>>): Doc {
  const docs = listDocs()
  const idx = docs.findIndex((d) => d.id === id)
  if (idx === -1) throw new Error('文档不存在')
  docs[idx] = { ...docs[idx], ...patch, updatedAt: Date.now() }
  writeJSON(DOCS_KEY, docs)
  return docs[idx]
}

export function deleteDoc(id: string) {
  const docs = listDocs().filter((d) => d.id !== id)
  writeJSON(DOCS_KEY, docs)
}

// ===== 文件夹 =====

export function listFolders(): Folder[] {
  return readJSON<Folder[]>(FOLDERS_KEY, []).sort((a, b) => a.createdAt - b.createdAt)
}

export function createFolder(name = '新建文件夹'): Folder {
  const folder: Folder = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now()
  }
  const folders = listFolders()
  folders.push(folder)
  writeJSON(FOLDERS_KEY, folders)
  return folder
}

export function renameFolder(id: string, name: string) {
  const folders = listFolders().map((f) => (f.id === id ? { ...f, name } : f))
  writeJSON(FOLDERS_KEY, folders)
}

export function deleteFolder(id: string) {
  const folders = listFolders().filter((f) => f.id !== id)
  writeJSON(FOLDERS_KEY, folders)
  // 文件夹删除后，其下文档移回根目录
  const docs = listDocs().map((d) => (d.folderId === id ? { ...d, folderId: null } : d))
  writeJSON(DOCS_KEY, docs)
}

export function listAttachments(): Attachment[] {
  return readJSON<Attachment[]>(ATTACH_KEY, [])
}

export function addAttachment(a: Attachment) {
  const list = listAttachments()
  list.unshift(a)
  writeJSON(ATTACH_KEY, list)
}
