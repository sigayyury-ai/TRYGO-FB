import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesCoreService from '../../services/HypothesesCoreService';
import hypothesesPersonProfileService from '../../services/HypothesesPersonProfileService';
import projectService from '../../services/ProjectService';
import { CreateMessageInput } from './createMessage';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';

export const createPersonProfileMessage = async (
    input: CreateMessageInput,
    userId: string
) => {
    try {
        if (!input.customerSegmentId) {
            throw new Error('Customer segment id is required');
        }

        const project = await projectService.getProjectById(
            input.projectId,
            userId
        );
        const hypothesesCore = await hypothesesCoreService.getHypothesesCore(
            input.projectHypothesisId,
            userId
        );

        const customerSegment = hypothesesCore.customerSegments.find(
            (customerSegment) =>
                customerSegment._id.toString() === input.customerSegmentId
        );
        if (!customerSegment) {
            throw new Error('Customer segment not found');
        }

        const personProfile =
            await hypothesesPersonProfileService.getPersonProfileByCustomerSegmentId(
                input.customerSegmentId,
                userId
            );

        console.log('personProfile', personProfile);

        const prompt = prompts.createPersonProfileMessage(
            input.message,
            customerSegment,
            personProfile,
            input.wantToChangeInfo
        );

        const aiResponse = await chatGPTService.createAnswerWithThreadJsonSchema(
            JsonSchemaType.PERSON_PROFILE_MESSAGE,
            prompt,
            project.assistantId,
            hypothesesCore.threadId,
            20000,
            { wantToChangeInfo: input.wantToChangeInfo }
        );

        if (input.wantToChangeInfo) {
            const newPersonProfile = {
                ...personProfile.toObject(),
                ...aiResponse.response,
                id: personProfile._id.toString(),
            };
            await hypothesesPersonProfileService.changeHypothesesPersonProfile(
                newPersonProfile,
                userId
            );
        }

        return aiResponse.response.message;
    } catch (error) {
        console.error(error);
    }
};
