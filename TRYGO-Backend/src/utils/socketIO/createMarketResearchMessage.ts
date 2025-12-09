import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesMarketResearchService from '../../services/HypothesesMarketResearchService';
import projectService from '../../services/ProjectService';
import { CreateMessageInput } from './createMessage';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';

export const createMarketResearchMessage = async (
    input: CreateMessageInput,
    userId: string
) => {
    try {
        const project = await projectService.getProjectById(
            input.projectId,
            userId
        );
        const hypothesesMarketResearch = await hypothesesMarketResearchService.getHypothesesMarketResearchWithCheck(
            input.projectHypothesisId,
            userId
        );

        const prompt = prompts.createMarketResearchMessage(
            input.message,
            hypothesesMarketResearch,
            input.wantToChangeInfo
        );

        const aiResponse = await chatGPTService.createAnswerWithThreadJsonSchema(
            JsonSchemaType.MARKET_RESEARCH_MESSAGE,
            prompt,
            project.assistantId,
            hypothesesMarketResearch.threadId,
            20000,
            { wantToChangeInfo: input.wantToChangeInfo }
        );

        if (input.wantToChangeInfo) {
            await hypothesesMarketResearchService.changeHypothesesMarketResearch(
                {
                    id: hypothesesMarketResearch._id.toString(),
                    summary: aiResponse.response.summary,
                },
                userId
            );
        }

        return aiResponse.response.message;
    } catch (error) {
        console.error(error);
    }
};
