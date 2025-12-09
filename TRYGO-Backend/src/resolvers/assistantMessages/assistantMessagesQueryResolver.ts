import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import assistantMessagesService from '../../services/AssistantMessagesService';

const assistantMessagesQueryResolver = {
    Query: {
        async getAssistantMessages(_: never, __: unknown, context: IContext) {
            try {
                return await assistantMessagesService.getAssistantMessages(
                    context.userId
                );
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default assistantMessagesQueryResolver;
