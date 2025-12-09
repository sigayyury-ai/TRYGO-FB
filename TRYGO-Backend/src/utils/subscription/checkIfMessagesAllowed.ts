import { SubscriptionType } from "../../generated/graphql";
import assistantMessagesService from "../../services/AssistantMessagesService";
import subscriptionService from "../../services/subscription/SubscriptionService";

export const checkIfMessagesAllowed = async (userId: string) => {
    try {
        let messagesAllowed = false;

        const assistantMessages = await assistantMessagesService.getAssistantMessages(userId);
        const subscription = await subscriptionService.getSubscription(userId);
        if (subscription?.type === SubscriptionType.Starter) {
            messagesAllowed = assistantMessages.generatedMessages < 50;
        } else if (subscription?.type === SubscriptionType.Pro) {
            messagesAllowed = assistantMessages.generatedMessages < 300;
        } else {
            messagesAllowed = assistantMessages.generatedMessages < 10;
        }

        if (!messagesAllowed) {
            throw new Error('You have reached the maximum number of messages allowed for this month');
        }

        return messagesAllowed;
    } catch (error) {
        console.error(error);
        throw error;
    }
};