import bcrypt from 'bcrypt'

const BCRYPT_HASH_REGEX = /^\$2[ayb]\$.{56}$/

export interface ResultadoComparacion {
  valida: boolean
  requiereRehash: boolean
}

export function esHashBcrypt(cadena: string): boolean {
  return BCRYPT_HASH_REGEX.test(cadena)
}

export async function comparar(contraseña: string, hashOTexto: string): Promise<ResultadoComparacion> {
  if (!hashOTexto) {
    return { valida: false, requiereRehash: false }
  }

  if (esHashBcrypt(hashOTexto)) {
    const valida = await bcrypt.compare(contraseña, hashOTexto)
    return { valida, requiereRehash: false }
  }

  // Fallback para contraseñas insertadas manualmente en texto plano
  const valida = contraseña === hashOTexto
  return { valida, requiereRehash: valida }
}

