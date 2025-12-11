import { GraphQLFormattedError } from 'graphql';
import { config } from '../constants/config/env';
import { TgApi } from '../managers/tg/TgApi';

export const sendErrorToTg = (error: GraphQLFormattedError): void => {
    try {
        if (error.message.includes('Token is missing.')) {
            return;
        }
        TgApi.sendMessage(
            Number(config.TG_STATISTICS.ERROR_CHAT_ID),
            `Error: ${JSON.stringify(error)}`
        );
    } catch (error) {
        console.error(error);
    }
};
