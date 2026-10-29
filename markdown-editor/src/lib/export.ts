import { renderMarkdown } from './markdown'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'document'
}

export function exportMarkdown(title: string, content: string) {
  downloadBlob(content, `${sanitizeFilename(title)}.md`, 'text/markdown;charset=utf-8')
}

export function exportHtml(title: string, content: string) {
  const body = renderMarkdown(content)
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { max-width: 860px; margin: 40px auto; padding: 0 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.75; color: #24292f; }
  pre { background: #f6f8fa; padding: 16px; border-radius: 8px; overflow: auto; }
  code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: 0.9em; background: #f6f8fa; padding: 2px 5px; border-radius: 4px; }
  pre code { background: transparent; padding: 0; }
  blockquote { border-left: 4px solid #d0d7de; margin: 0; padding: 0 1em; color: #57606a; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #d0d7de; padding: 6px 13px; }
  img { max-width: 100%; }
</style>
</head>
<body>
${body}
</body>
</html>`
  downloadBlob(html, `${sanitizeFilename(title)}.html`, 'text/html;charset=utf-8')
}

export function exportPdf(title: string, content: string) {
  const body = renderMarkdown(content)
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.7; color: #111; margin: 0; padding: 40px; background: #fff; }
  h1 { font-size: 24px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
  h2 { font-size: 20px; } h3 { font-size: 17px; }
  pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow: auto; white-space: pre-wrap; }
  code { font-family: "SFMono-Regular", Consolas, monospace; font-size: 0.88em; background: #f4f4f4; padding: 1px 4px; border-radius: 3px; }
  pre code { background: transparent; padding: 0; }
  blockquote { border-left: 4px solid #ccc; margin: 0; padding: 0 1em; color: #555; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; }
  img { max-width: 100%; }
</style>
</head>
<body>${body}</body>
</html>`

  // 渲染到隐藏容器，再用 html2canvas 截图 + jsPDF 分页
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.style.width = '794px' // A4 宽度 @96dpi
  container.style.background = '#fff'
  container.innerHTML = html
  document.body.appendChild(container)

  html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    .then((canvas) => {
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${sanitizeFilename(title)}.pdf`)
    })
    .catch((err) => {
      console.error('PDF 导出失败', err)
      alert('PDF 导出失败，请重试')
    })
    .finally(() => {
      document.body.removeChild(container)
    })
}

export function exportDocx(title: string, content: string) {
  const body = renderMarkdown(content)
  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body>${body}</body>
</html>`
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFilename(title)}.doc`
  a.click()
  URL.revokeObjectURL(url)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
