// AWS S3 client is not initialized - AWS functionality is disabled
// This file exists to prevent import errors in files that reference it
// Functions using AWS will throw errors at runtime if called

function getS3Client(): never {
    throw new Error('AWS S3 is not configured. AWS functionality is disabled.');
}

export default getS3Client;
