export const elevateError = (err: any): never => {
    console.error('Error:', err);
    throw err;
};
