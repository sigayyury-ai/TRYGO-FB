import {
    ChangeHypothesesGtmInput,
    HypothesesGtm,
} from '../generated/graphql';
import HypothesesGtmModel from '../models/HypothesesGtmModel';
import { IHypothesesGtm } from '../types/IHypothesesGtm';
import { createGtmPart } from '../utils/hypothesis/createGtmPart';
import { preserveChannelIds } from '../utils/hypothesis/preserveChannelIds';

class HypothesesGtmService {
    private model: typeof HypothesesGtmModel = HypothesesGtmModel;

    async createHypothesesGtm(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesGtm> {
        try {
            const existingHypothesesGtm =
                await this.getHypothesesGtm(
                    projectHypothesisId,
                    userId
                );
            if (existingHypothesesGtm) {
                throw new Error('Hypotheses Gtm already exists');
            }

            return await createGtmPart({
                projectHypothesisId,
                userId,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async initHypothesesGtm(
        data: HypothesesGtm
    ): Promise<IHypothesesGtm> {
        try {
            return await this.model.create(data);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getHypothesesGtm(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesGtm | null> {
        try {
            return await this.model.findOne({
                projectHypothesisId,
                userId,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

        async getHypothesesGtmWithCheck(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesGtm> {
        try {
            const hypothesesGtm =
                await this.getHypothesesGtm(
                    projectHypothesisId,
                    userId
                );
            if (!hypothesesGtm) {
                throw new Error('Hypotheses Gtm not found');
            }
            return hypothesesGtm;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async changeHypothesesGtm(
        input: ChangeHypothesesGtmInput,
        userId: string
    ): Promise<IHypothesesGtm> {
        try {
            // First, get the existing document to preserve channel IDs
            const existingHypothesesGtm = await this.model.findOne({
                userId,
                _id: input.id,
            });
            
            if (!existingHypothesesGtm) {
                throw new Error('Hypotheses Gtm not found');
            }

            // Preserve existing channel _ids when updating
            const dataForUpdate = preserveChannelIds(input, existingHypothesesGtm);
            
            const hypothesesGtm = await this.model.findOneAndUpdate(
                {
                    userId,
                    _id: input.id,
                },
                dataForUpdate,
                {
                    new: true,
                }
            );
            
            return hypothesesGtm!;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async deleteHypothesesGtm(projectHypothesisId: string, userId: string): Promise<void> {
        try {
            await this.model.findOneAndDelete({ projectHypothesisId, userId });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const hypothesesGtmService = new HypothesesGtmService();
export default hypothesesGtmService;
