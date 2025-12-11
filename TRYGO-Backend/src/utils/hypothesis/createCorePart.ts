import { Types } from 'mongoose';
import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesCoreService from '../../services/HypothesesCoreService';
import hypothesesPersonProfileService from '../../services/HypothesesPersonProfileService';
import { IProjectHypothesis } from '../../types/IProjectHypothesis';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';

export const createCorePart = async ({
    projectHypothesis,
    assistantId,
    userId,
    promptPart,
}: {
    projectHypothesis: IProjectHypothesis;
    assistantId: string;
    userId: string;
    promptPart?: string;
}) => {
    try {
        const prompt =
            prompts.createHypothesesCoreWithPersonProfiles(projectHypothesis, promptPart);
        console.log('prompt', prompt);
        const gptResponse = await chatGPTService.createAnswerWithAssistantJsonSchema(
            JsonSchemaType.HYPOTHESES_CORE_WITH_PERSON_PROFILES,
            prompt,
            assistantId,
            20000
        );
        const jsonData = gptResponse.response.response;
        const threadId = gptResponse.threadId;

        const createdCore = await hypothesesCoreService.createHypothesesCore(
            projectHypothesis,
            threadId,
            userId,
            jsonData
        );

        for (const customerSegment of jsonData.customerSegments) {
            console.log('customerSegment.', customerSegment);
            const customerSegmentId = createdCore.customerSegments
                .find((segment) => segment.name === customerSegment.name)
                ?._id.toString();
            console.log('customerSegmentId', customerSegmentId);
            await hypothesesPersonProfileService.createHypothesesPersonProfile({
                ...customerSegment.personProfile,
                projectHypothesisId: projectHypothesis._id.toString(),
                id: new Types.ObjectId().toString(),
                customerSegmentId: customerSegmentId,
                userId,
            });
        }
        console.log(
            'jsonData.customerSegments.length',
            jsonData.customerSegments.length
        );
    } catch (error) {
        console.error(error);
        throw error;
    }
};
