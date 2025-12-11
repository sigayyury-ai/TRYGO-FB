import TelegramBot, { SendMessageOptions } from 'node-telegram-bot-api';

interface ChatIdMessage {
    chatId: number;
    message: string;
}

export interface SendTgMessageBotToken extends ChatIdMessage {
    botToken: string;
}

export interface SendTgMessageBotOptions extends ChatIdMessage {
    bot: TelegramBot;
    options?: SendMessageOptions;
}
