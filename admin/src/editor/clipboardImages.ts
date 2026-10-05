export function imageFilesFromClipboard(data: DataTransfer | null) {
  if (!data) return []
  const files = Array.from(data.files ?? []).filter((file) => file.type.startsWith('image/'))
  if (files.length) return files
  return Array.from(data.items ?? []).flatMap((item) => {
    if (!item.type.startsWith('image/')) return []
    const file = item.getAsFile()
    return file ? [file] : []
  })
}

export function imageFilesFromHtml(html: string) {
  const files: File[] = []
  for (const match of html.matchAll(/<img\b[^>]*src=["']([^"']+)["']/gi)) {
    const data = match[1].match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!data) continue
    try {
      const binary = atob(data[2])
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
      files.push(new File([bytes], `pasted-image.${data[1].split('/')[1] || 'png'}`, {type: data[1]}))
    } catch { /* Ignore malformed clipboard images. */ }
  }
  return files
}
