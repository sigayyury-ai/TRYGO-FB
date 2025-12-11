import { config } from '../../constants/config/env';

export const toAwsUrl = (key: string) => {
    // AWS отключен - возвращаем пустую строку или локальный путь
    if (!config.AWS_BUCKET_NAME || !config.AWS_REGION) {
        console.warn('AWS not configured, returning empty URL');
        return '';
    }
    const bucketName = config.AWS_BUCKET_NAME;
    const awsRegion = config.AWS_REGION;
    return `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${key}`;
};
