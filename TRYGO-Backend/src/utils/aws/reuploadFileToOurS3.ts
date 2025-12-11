// AWS S3 reupload functionality is disabled
// This function exists to prevent import errors but will throw at runtime if called

export const reuploadFileFromUrlToS3 = async (
    fileUrl: string,
    directory?: string
): Promise<string> => {
    throw new Error('AWS S3 is not configured. File reupload functionality is disabled.');
};
