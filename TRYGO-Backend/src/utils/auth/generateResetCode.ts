export const generateResetCode = (
    length: number
): {
    resetCode: number;
    expireAt: Date;
} => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;

    const resetCode = Math.floor(min + Math.random() * (max - min + 1));

    const expireAt = new Date(Date.now() + 60 * 60 * 1000);

    return { resetCode, expireAt };
};
