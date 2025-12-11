import { InlineKeyboardButton } from 'node-telegram-bot-api';

export interface FormattedTgDailyPublicProfile {
    message: string;
    button: InlineKeyboardButton;
    imagePath?: string;
}
