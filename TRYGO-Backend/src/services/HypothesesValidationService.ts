import { prompts } from '../constants/aIntelligence/prompts';
import {
    ChangeHypothesesValidationInput,
    HypothesesValidation,
    UploadHypothesesValidationCustomerInterviewInput,
} from '../generated/graphql';
import HypothesesValidationModel from '../models/HypothesesValidationModel';
import { IHypothesesValidation } from '../types/IHypothesesValidation';
import { createValidationPart } from '../utils/hypothesis/createValidationPart';
import chatGPTService from './ai/ChatGPTService';
import projectHypothesesService from './ProjectHypothesesService';
import projectService from './ProjectService';
import { JsonSchemaType } from '../types/ChatGPT/JsonSchemaTypes';

class HypothesesValidationService {
    private model: typeof HypothesesValidationModel = HypothesesValidationModel;

    async createHypothesesValidation(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesValidation> {
        try {
            const existingHypothesesValidation =
                await this.getHypothesesValidation(projectHypothesisId, userId);
            if (existingHypothesesValidation) {
                throw new Error('Hypotheses validation already exists');
            }

            return await createValidationPart({
                projectHypothesisId,
                userId,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async initHypothesesValidation(
        data: HypothesesValidation
    ): Promise<IHypothesesValidation> {
        try {
            return await this.model.create(data);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getHypothesesValidation(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesValidation | null> {
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

    async getHypothesesValidationWithCheck(
        projectHypothesisId: string,
        userId: string
    ): Promise<IHypothesesValidation> {
        try {
            const hypothesesValidation = await this.getHypothesesValidation(
                projectHypothesisId,
                userId
            );
            if (!hypothesesValidation) {
                throw new Error('Hypotheses validation not found');
            }
            return hypothesesValidation;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async changeHypothesesValidation(
        input: ChangeHypothesesValidationInput,
        userId: string
    ): Promise<IHypothesesValidation> {
        try {
            const hypothesesValidation = await this.model.findOneAndUpdate(
                {
                    userId,
                    _id: input.id,
                },
                input,
                {
                    new: true,
                }
            );
            if (!hypothesesValidation) {
                throw new Error('Hypotheses validation not found');
            }
            return hypothesesValidation;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async uploadHypothesesValidationCustomerInterview(
        input: UploadHypothesesValidationCustomerInterviewInput,
        userId: string
    ): Promise<IHypothesesValidation> {
        try {
            const hypothesesValidation = await this.model.findOneAndUpdate(
                {
                    userId,
                    _id: input.id,
                },
                {
                    $set: {
                        uploadedCustomerInterviews: input.customerInterview,
                    },
                },
                {
                    new: true,
                }
            );
            if (!hypothesesValidation) {
                throw new Error('Hypotheses validation not found');
            }

            const projectHypothesis =
                await projectHypothesesService.getProjectHypothesisByIdWithCheck(
                    hypothesesValidation.projectHypothesisId.toString(),
                    userId
                );

            const project = await projectService.getProjectById(
                projectHypothesis.projectId.toString(),
                userId
            );

            const prompt = prompts.createValidationInsightsCustomerInterviews(
                input.customerInterview
            );

            const aiResponse = await chatGPTService.createAnswerWithThreadJsonSchema(
                JsonSchemaType.VALIDATION_INSIGHTS_CUSTOMER_INTERVIEWS,
                prompt,
                project.assistantId,
                hypothesesValidation.threadId,
                20000
            );

            hypothesesValidation.insightsCustomerInterviews =
                aiResponse.response.insightsCustomerInterviews;
            hypothesesValidation.summaryInterview = aiResponse.response.summaryInterview;

            await hypothesesValidation.save();

            return hypothesesValidation;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }



    async deleteHypothesesValidation(projectHypothesisId: string, userId: string): Promise<void> {
        try {
            await this.model.findOneAndDelete({ projectHypothesisId, userId });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const hypothesesValidationService = new HypothesesValidationService();
export default hypothesesValidationService;
