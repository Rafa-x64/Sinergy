export function capitalizarPalabras(texto: string): string {
  if (!texto || typeof texto !== 'string') return ''

  return texto
    .trim()
    .toLowerCase()
    .split(' ')
    .map(palabra => {
      if (palabra.length === 0) return palabra
      return palabra.charAt(0).toUpperCase() + palabra.slice(1)
    })
    .join(' ')
}
