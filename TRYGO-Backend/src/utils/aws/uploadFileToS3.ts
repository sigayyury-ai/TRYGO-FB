// AWS S3 upload functionality is disabled
// This function exists to prevent import errors but will throw at runtime if called

export const uploadFileToS3 = async (
    file: Express.Multer.File,
    directory?: string
): Promise<string> => {
    throw new Error('AWS S3 is not configured. File upload functionality is disabled.');
};
