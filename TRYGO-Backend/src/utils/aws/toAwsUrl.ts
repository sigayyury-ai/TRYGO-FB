import { config } from '../../constants/config/env';

const bucketName = config.AWS_BUCKET_NAME;
const awsRegion = config.AWS_REGION;

export const toAwsUrl = (key: string) => {
    return `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${key}`;
};
