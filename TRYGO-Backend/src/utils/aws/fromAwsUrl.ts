import { config } from '../../constants/config/env';

export const fromAwsUrl = (url: string) => {
    // AWS отключен - возвращаем URL как есть
    if (!config.AWS_BUCKET_NAME || !config.AWS_REGION) {
        return url;
    }
    const bucketName = config.AWS_BUCKET_NAME;
    const awsRegion = config.AWS_REGION;
    return url.replace(
        `https://${bucketName}.s3.${awsRegion}.amazonaws.com/`,
        ''
    );
};
