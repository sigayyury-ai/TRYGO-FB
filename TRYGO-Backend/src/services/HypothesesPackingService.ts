import {
    ChangeHypothesesPackingInput,
    HypothesesPacking,
} from '../generated/graphql';
import HypothesesPackingModel from '../models/HypothesesPackingModel';
import { IHypothesesPacking } from '../types/IHypothesesPacking';
import { createPackingPart } from '../utils/hypothesis/createPackingPart';

class HypothesesPackingService {
    private model: typeof HypothesesPackingModel = HypothesesPackingModel;

    async createHypothesesPacking(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesPacking> {
        try {
            const existingHypothesesPacking =
                await this.getHypothesesPacking(projectHypothesisId, userId);
            if (existingHypothesesPacking) {
                throw new Error('Hypotheses packing already exists');
            }

            return await createPackingPart({
                projectHypothesisId,
                userId,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async initHypothesesPacking(
        data: HypothesesPacking
    ): Promise<IHypothesesPacking> {
        try {
            return await this.model.create(data);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getHypothesesPacking(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesPacking | null> {
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

    async getHypothesesPackingWithCheck(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesPacking> {
        try {
            const hypothesesPacking = await this.getHypothesesPacking(
                projectHypothesisId,
                userId
            );
                    if (!hypothesesPacking) {
                throw new Error('Hypotheses packing not found');
            }
            return hypothesesPacking;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async changeHypothesesPacking(
        input: ChangeHypothesesPackingInput,
        userId: string
    ): Promise<IHypothesesPacking> {
        try {
            const hypothesesPacking = await this.model.findOneAndUpdate(
                {
                    userId,
                    _id: input.id,
                },
                input,
                {
                    new: true,
                }
            );
            if (!hypothesesPacking) {
                throw new Error('Hypotheses packing not found');
            }
            return hypothesesPacking;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async deleteHypothesesPacking(projectHypothesisId: string, userId: string): Promise<void> {
        try {
            await this.model.findOneAndDelete({ projectHypothesisId, userId });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const hypothesesPackingService = new HypothesesPackingService();
export default hypothesesPackingService;
