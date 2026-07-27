import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12;

export async function encriptar(contraseña: string): Promise<string>{
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(contraseña, salt);
    return hash;
}

