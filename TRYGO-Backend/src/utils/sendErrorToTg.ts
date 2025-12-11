import { GraphQLFormattedError } from 'graphql';
import { config } from '../constants/config/env';
import { TgApi } from '../managers/tg/TgApi';

export const sendErrorToTg = (error: GraphQLFormattedError): void => {
    try {
        // Skip if token is missing or Telegram is disabled
        if (error.message.includes('Token is missing.') || !config.TG_STATISTICS.TOKEN) {
            return;
        }
        
        // Skip if error chat ID is not configured
        if (!config.TG_STATISTICS.ERROR_CHAT_ID) {
            return;
        }
        
        TgApi.sendMessage(
            Number(config.TG_STATISTICS.ERROR_CHAT_ID),
            `Error: ${JSON.stringify(error)}`
        );
    } catch (error) {
        // Silently fail - don't log Telegram errors to avoid spam
        // Telegram errors are non-critical
    }
};
