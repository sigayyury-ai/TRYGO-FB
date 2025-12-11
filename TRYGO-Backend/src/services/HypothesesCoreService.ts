import mongoose, { Types } from 'mongoose';
import { ChangeHypothesesCoreInput } from '../generated/graphql';
import HypothesesCoreModel from '../models/HypothesesCoreModel';
import { IHypothesesCore } from '../types/IHypothesesCore';
import { IProjectHypothesis } from '../types/IProjectHypothesis';
import agenda from '../jobs';

class HypothesesCoreService {
    private model: typeof HypothesesCoreModel = HypothesesCoreModel;

    async createHypothesesCore(
        projectHypothesis: IProjectHypothesis,
        threadId: string,
        userId: string,
        data: any
    ): Promise<IHypothesesCore> {
        try {
            return await this.model.create({
                projectHypothesisId: projectHypothesis._id.toString(),
                userId,
                threadId,
                ...data,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getHypothesesCore(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesCore> {
        try {
            const hypothesesCore = await this.model.findOne({
                projectHypothesisId,
                userId,
            });
            if (!hypothesesCore) {
                throw new Error('Hypotheses core not found');
            }
            return hypothesesCore;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async changeHypothesesCore(
        input: ChangeHypothesesCoreInput,
        userId: string
    ): Promise<IHypothesesCore> {
        try {
            const hypothesesCore = await this.model.findOne({
                userId,
                _id: input.id,
            });
            if (!hypothesesCore) {
                throw new Error('Hypotheses core not found');
            }

            const dataForUpdate: any = input;
            if (dataForUpdate.customerSegments) {
                for (const customerSegment of dataForUpdate.customerSegments) {
                    if (customerSegment.id) {
                        customerSegment._id = customerSegment.id;
                    } else {
                        const customerSegmentId = new mongoose.Types.ObjectId();

                        customerSegment._id = customerSegmentId;
                        customerSegment.id = customerSegmentId.toString();
                        //chatgpt request
                        console.log('createHypothesesPersonProfile', {
                            userId,
                            customerSegment,
                            projectHypothesisId: hypothesesCore.projectHypothesisId.toString(),
                        });
                        await agenda.now('createHypothesesPersonProfile', {
                            userId,
                            customerSegment,
                            projectHypothesisId: hypothesesCore.projectHypothesisId.toString(),
                        });
                        //create new model
                    }
                }
            }
            const updatedHypothesesCore = await this.model.findOneAndUpdate(
                {
                    userId,
                    _id: input.id,
                },
                dataForUpdate,
                {
                    new: true,
                }
            );
            if (!updatedHypothesesCore) {
                throw new Error('Hypotheses core not found');
            }
            return updatedHypothesesCore;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async deleteHypothesesCore(projectHypothesisId: string, userId: string): Promise<void> {
        try {
            await this.model.findOneAndDelete({ projectHypothesisId, userId });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const hypothesesCoreService = new HypothesesCoreService();
export default hypothesesCoreService;
