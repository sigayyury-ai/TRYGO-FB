import { S3Client } from '@aws-sdk/client-s3';
import { config } from './env';

const region = config.AWS_REGION;
const accessKeyId = config.AWS_ACCESS_KEY_ID;
const secretAccessKey = config.AWS_SECRET_ACCESS_KEY;

if (!region) {
    throw new Error('AWS region is not defined in the environment variables.');
}

if (!accessKeyId) {
    throw new Error(
        'AWS access key id is not defined in the environment variables.'
    );
}

if (!secretAccessKey) {
    throw new Error(
        'AWS secret access key is not defined in the environment variables.'
    );
}

const s3Client = new S3Client({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    },
} as any);

export default s3Client;
