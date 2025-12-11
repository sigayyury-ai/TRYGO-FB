import { ChangeProjectAssistantInput } from '../generated/graphql';
import AssistantMessagesModel from '../models/AssistantMessagesModel';
import { IAssistantMessages } from '../types/IAssistantMessages';

class AssistantMessagesService {
    private model: typeof AssistantMessagesModel = AssistantMessagesModel;

    async getAssistantMessages(userId: string): Promise<IAssistantMessages> {
        try {
            const startOfMonth = new Date(new Date().setDate(1));
            startOfMonth.setHours(0, 0, 0, 0);
            const assistantMessages = await this.model.findOne({
                userId,
                createdAt: { $gte: startOfMonth },
            });

            if (!assistantMessages) {
                return await this.model.create({
                    userId,
                });
            }

            return assistantMessages;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async incrementGeneratedMessages(userId: string): Promise<void> {
        try {
            const assistantMessages = await this.getAssistantMessages(userId);
            assistantMessages.generatedMessages++;
            await assistantMessages.save();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
const assistantMessagesService = new AssistantMessagesService();
export default assistantMessagesService;
