import { File } from 'multer';

// AWS S3 upload functionality is disabled
// This function exists to prevent import errors but will throw at runtime if called

export const uploadImageToS3 = async (
    file: File,
    directory?: string
): Promise<string> => {
    throw new Error('AWS S3 is not configured. Image upload functionality is disabled.');
};
