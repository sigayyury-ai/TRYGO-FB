// AWS S3 delete functionality is disabled
// This function exists to prevent import errors but will throw at runtime if called

export const deleteFromS3 = async (fileName: string): Promise<void> => {
    throw new Error('AWS S3 is not configured. File delete functionality is disabled.');
};
