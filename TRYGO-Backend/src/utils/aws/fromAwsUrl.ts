import { config } from '../../constants/config/env';

const bucketName = config.AWS_BUCKET_NAME;
const awsRegion = config.AWS_REGION;

export const fromAwsUrl = (url: string) => {
    return url.replace(
        `https://${bucketName}.s3.${awsRegion}.amazonaws.com/`,
        ''
    );
};
