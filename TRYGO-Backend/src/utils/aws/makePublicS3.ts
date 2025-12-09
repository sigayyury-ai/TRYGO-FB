import { PutObjectAclCommand } from '@aws-sdk/client-s3';
import { config } from '../../constants/config/env';
import s3Client from '../../constants/config/awsConfig';

const bucketName = config.AWS_BUCKET_NAME!;

export const makePublicS3 = async (url: string): Promise<string> => {
    const fileName = url.match(/^s3:\/\/[^\/]+\/(.+)$/)?.[1];
    const params = {
        Bucket: bucketName,
        Key: fileName,
        ACL: 'public-read',
    };

    try {
        const command = new PutObjectAclCommand(params as any);
        await s3Client.send(command);
        return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
    } catch (error) {
        console.error(error);
        throw new Error(`Ошибка при установке публичного доступа: ${error}`);
    }
};
