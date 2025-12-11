// AWS S3 make public functionality is disabled
// This function exists to prevent import errors but will throw at runtime if called

export const makePublicS3 = async (url: string): Promise<string> => {
    throw new Error('AWS S3 is not configured. Make public functionality is disabled.');
};
