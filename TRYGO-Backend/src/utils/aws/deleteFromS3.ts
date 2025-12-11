import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../../constants/config/env';
import s3Client from '../../constants/config/awsConfig';
const bucketName = config.AWS_BUCKET_NAME!;

export const deleteFromS3 = async (fileName: string): Promise<void> => {
    const deleteParams = {
        Bucket: bucketName,
        Key: fileName,
    };

    try {
        const command = new DeleteObjectCommand(deleteParams) as any;
        await s3Client.send(command);
    } catch (error) {
        throw new Error(`Failed to delete file from S3. ${error}`);
    }
};
