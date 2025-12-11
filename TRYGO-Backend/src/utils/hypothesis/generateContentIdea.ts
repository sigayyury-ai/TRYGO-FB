import { prompts } from "../../constants/aIntelligence/prompts";
import chatGPTService from "../../services/ai/ChatGPTService";
import { IHypothesesGtmDetailedChannel } from "../../types/IHypothesesGtmDetailedChannel";
import { JsonSchemaType } from "../../types/ChatGPT/JsonSchemaTypes";

export const generateContentIdea = async (hypothesesGtmDetailedChannel: IHypothesesGtmDetailedChannel) => {
    try {
        const prompt = prompts.generateContentIdea(hypothesesGtmDetailedChannel);
        const aiResponse = await chatGPTService.generateMessageWithJsonSchema(
            JsonSchemaType.GENERATE_CONTENT_IDEA,
            prompt,
            20000
        );
        console.log('aiResponse', aiResponse);
        return aiResponse.response;
    } catch (error) {
        console.error(error);
        throw error;
    }
}