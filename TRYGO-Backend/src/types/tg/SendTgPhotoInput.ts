import TelegramBot, { SendPhotoOptions } from 'node-telegram-bot-api';

export interface SendTgPhotoInput {
    chatId: number;
    imagePath: string;
    caption?: string;
}

export interface SendTgPhotoFromInitializedBotInput extends SendTgPhotoInput {
    bot: TelegramBot;
    options?: SendPhotoOptions;
}
