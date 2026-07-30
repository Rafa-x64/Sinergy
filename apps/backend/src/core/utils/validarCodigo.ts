export function validarCodigo(texto: string, regex: RegExp): boolean {
    if (!texto || typeof texto !== 'string') {
        return false
    }
    return regex.test(texto.trim())
}
