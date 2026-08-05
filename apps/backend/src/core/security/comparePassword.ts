import bcrypt from 'bcrypt'

export async function comparar(contraseña: string, hash: string): Promise<boolean> {
    return bcrypt.compare(contraseña, hash);
}
