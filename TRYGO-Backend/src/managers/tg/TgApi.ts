import TelegramBot, { Message } from 'node-telegram-bot-api';
import { config } from '../../constants/config/env';
import {
    SendTgMessageBotToken,
    SendTgPhotoInput,
    SendTgPhotoFromInitializedBotInput,
    SendTgMessageBotOptions,
} from '../../types';

export class TgApi {
    private static botInstance: TelegramBot | null = null;

    static initialize(): void {
        try {
            if (config.TG_STATISTICS.ENABLED === 'false' || !config.TG_STATISTICS.TOKEN) {
                return;
            }
            TgApi.botInstance = new TelegramBot(config.TG_STATISTICS.TOKEN);
            console.log('Telegram API initialized');
        } catch (error) {
            console.error(error);
        }
    }

    static getBotInstance(): TelegramBot {
        try {
            if (!TgApi.botInstance) {
                throw new Error(
                    'Telegram Bot is not initialized. Call initialize() first.'
                );
            }
            return TgApi.botInstance;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async sendMessage(chatId: number, message: string): Promise<void> {
        try {
            if (config.TG_STATISTICS.ENABLED === 'false') {
                return;
            }
            await TgApi.getBotInstance().sendMessage(Number(chatId), message);
        } catch (error) {
            console.error(error);
        }
    }

    static async sendPhoto(input: SendTgPhotoInput): Promise<void> {
        try {
            if (!config.TG_STATISTICS.ENABLED) {
                return;
            }
            await TgApi.getBotInstance().sendPhoto(
                input.chatId,
                input.imagePath,
                {
                    caption: input.caption,
                }
            );
        } catch (error) {
            console.error(error);
        }
    }

    static sendPhotoFromInitializedBot(
        input: SendTgPhotoFromInitializedBotInput
    ): void {
        try {
            if (config.TG_STATISTICS.ENABLED === 'false') {
                return;
            }
            input.bot
                .sendPhoto(Number(input.chatId), input.imagePath, input.options)
                .then(() => {
                    console.log('Message for another bot sent successfully');
                })
                .catch((error) => {
                    console.error('Error sending message:', error);
                });
        } catch (error) {
            console.error(error);
        }
    }

    static handleMessages(handler: (msg: Message) => void): void {
        try {
            if (config.TG_STATISTICS.ENABLED === 'false') {
                return;
            }
            TgApi.getBotInstance().on('message', handler);
        } catch (error) {
            console.error(error);
        }
    }
}
