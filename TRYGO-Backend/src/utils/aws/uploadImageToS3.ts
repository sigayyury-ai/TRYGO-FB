import crypto from 'crypto';
import {
    ObjectCannedACL,
    PutObjectCommand,
    PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { config } from '../../constants/config/env';
import s3Client from '../../constants/config/awsConfig';

const bucketName = config.AWS_BUCKET_NAME;
const awsRegion = config.AWS_REGION;

if (!bucketName) {
    throw new Error(
        'AWS bucket name is not defined in the environment variables.'
    );
}

if (!awsRegion) {
    throw new Error('AWS region is not defined in the environment variables.');
}

export const uploadImageToS3 = async (
    file: Express.Multer.File,
    directory?: string
): Promise<string> => {
    if (!file) throw new Error('No file provided.');

    const fileExtension = file.originalname.split('.').pop();
    const randomName = crypto.randomBytes(16).toString('hex');
    let key = `${randomName}.${fileExtension}`;
    let contentType = 'image/webp';

    if (directory) {
        key = `${directory}/${key}`;
        contentType = file.mimetype;
    }

    const uploadParams: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
        ACL: 'public-read' as ObjectCannedACL,
    };
    console.log(uploadParams);

    try {
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        return `https://${uploadParams.Bucket}.s3.${awsRegion}.amazonaws.com/${uploadParams.Key}`;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};
