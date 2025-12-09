import crypto from 'crypto';
import {
    ObjectCannedACL,
    PutObjectCommand,
    PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { config } from '../../constants/config/env';
import s3Client from '../../constants/config/awsConfig';
import { toAwsUrl } from './toAwsUrl';
import axios from 'axios';

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

export const reuploadFileFromUrlToS3 = async (
    fileUrl: string,
    directory?: string
): Promise<string> => {
    if (!fileUrl) throw new Error('Please provide a correct youtube url.');

    try {
        // Извлекаем имя файла из URL
        const fileName = fileUrl.split('/').pop();
        const randomName = crypto.randomBytes(16).toString('hex');
        const fileExtension = 'mp3'; // Жёстко задаём mp3
        let key = `${randomName}.${fileExtension}`;

        if (directory) {
            key = `${directory}/${key}`;
        }

        // Загружаем файл с URL
        const response = await axios.get(fileUrl, {
            responseType: 'arraybuffer',
        });

        const fileBuffer = Buffer.from(response.data);
        const contentType = 'audio/mpeg'; // Устанавливаем MIME-тип для MP3

        const uploadParams: PutObjectCommandInput = {
            Bucket: bucketName,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
            ACL: 'public-read' as ObjectCannedACL,
        };

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        return toAwsUrl(key);
    } catch (error) {
        console.error('Error uploading MP3 file from URL:', error);
        throw error;
    }
};
