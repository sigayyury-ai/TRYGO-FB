import { RequestedFeature } from '../generated/graphql';
import RequestFeatureModel from '../models/RequestFeatureModel';

class RequestFeatureService {
    private model: typeof RequestFeatureModel = RequestFeatureModel;

    async createRequestFeature(
        userId: string,
        requestedFeature: RequestedFeature
    ) {
        try {
            await this.model.findOneAndUpdate(
                {
                    userId,
                    requestedFeature,
                },
                {},
                {
                    new: true,
                    upsert: true,
                }
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const requestFeatureService = new RequestFeatureService();
export default requestFeatureService;
