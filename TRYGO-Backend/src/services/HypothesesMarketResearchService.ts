import {
    ChangeHypothesesMarketResearchInput,
    HypothesesMarketResearch,
} from '../generated/graphql';
import HypothesesMarketResearchModel from '../models/HypothesesMarketResearchModel';
import { IHypothesesMarketResearch } from '../types/IHypothesesMarketResearch';
import { createMarketResearchPart } from '../utils/hypothesis/createMarketResearchPart';

class HypothesesMarketResearchervice {
    private model: typeof HypothesesMarketResearchModel =
        HypothesesMarketResearchModel;

    async createHypothesesMarketResearch(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesMarketResearch> {
        try {
            const existingHypothesesMarketResearch =
                await this.getHypothesesMarketResearch(
                    projectHypothesisId,
                    userId
                );
            if (existingHypothesesMarketResearch) {
                return existingHypothesesMarketResearch;
            }

            return await createMarketResearchPart({
                projectHypothesisId,
                userId,
            });
        } catch (error) {
            console.error('[HypothesesMarketResearchService] Error in createHypothesesMarketResearch:', error);
            throw error;
        }
    }

    async initHypothesesMarketResearch(
        data: HypothesesMarketResearch
    ): Promise<IHypothesesMarketResearch> {
        try {
            return await this.model.create(data);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getHypothesesMarketResearch(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesMarketResearch | null> {
        try {
            const result = await this.model.findOne({
                projectHypothesisId,
                userId,
            });
            return result;
        } catch (error) {
            console.error('[HypothesesMarketResearchService] Error getting market research:', error);
            throw error;
        }
    }

    async getHypothesesMarketResearchWithCheck(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesMarketResearch> {
        try {
            const hypothesesMarketResearch =
                await this.getHypothesesMarketResearch(
                    projectHypothesisId,
                    userId
                );
            if (!hypothesesMarketResearch) {
                throw new Error('Hypotheses market research not found');
            }
            return hypothesesMarketResearch;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async changeHypothesesMarketResearch(
        input: ChangeHypothesesMarketResearchInput,
        userId: string
    ): Promise<IHypothesesMarketResearch> {
        try {
            const hypothesesMarketResearch = await this.model.findOneAndUpdate(
                {
                    userId,
                    _id: input.id,
                },
                input,
                {
                    new: true,
                }
            );
            if (!hypothesesMarketResearch) {
                throw new Error('Hypotheses market research not found');
            }
            return hypothesesMarketResearch;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async deleteHypothesesMarketResearch(projectHypothesisId: string, userId: string): Promise<void> {
        try {
            await this.model.findOneAndDelete({ projectHypothesisId, userId });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const hypothesesMarketResearchService = new HypothesesMarketResearchervice();
export default hypothesesMarketResearchService;
