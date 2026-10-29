import MarkdownIt from 'markdown-it'

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
})

export function renderMarkdown(src: string): string {
  return md.render(src)
}
