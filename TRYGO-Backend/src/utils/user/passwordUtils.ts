import bcrypt from 'bcrypt';

const SALT_ROUNDS: number = 5;

const createPasswordHash = async (password: string): Promise<string> => {
    const salt: string = await bcrypt.genSalt(SALT_ROUNDS);

    return await bcrypt.hash(password, salt);
};

const comparePasswordHash = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
};

export { createPasswordHash, comparePasswordHash };
