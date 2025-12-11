import { config } from '../../constants/config/env';
import { elevateError } from '../../errors/elevateError';
import { TgApi } from '../../managers/tg/TgApi';
import subscriptionService from '../../services/subscription/SubscriptionService';
import userService from '../../services/UserService';

export const sendDailyStatistic = async () => {
    try {
        const retentionDays = [1, 7, 14, 30];

        const newUsersByDay: Record<number, number> = {};
        for (const day of retentionDays) {
            newUsersByDay[day] = await userService.getNumberNewUsersByDays(day);
        }

        const retainedUsersByDay: Record<number, number> = {};
        for (const day of retentionDays) {
            retainedUsersByDay[day] =
                await userService.getNumberRetainedUsersByDays(day);
        }

        // // Вычисляем Retention для каждого периода
        const retentionResults: Record<string, number> = {};
        for (const day of retentionDays) {
            const newUsersCount = newUsersByDay[day];
            const retainedUsersCount = retainedUsersByDay[day];

            retentionResults[`retentionD${day}`] =
                newUsersCount > 0
                    ? (retainedUsersCount / newUsersCount) * 100
                    : 0;
        }

        const dau = await userService.getActiveUsersByDays(1);
        const wau = await userService.getActiveUsersByDays(7);
        const mau = await userService.getActiveUsersByDays(30);

        // const createdOpenLessons =
        //     await aiChatService.getNumberOfCreatedChatsForLast24Hours(
        //         AiChatType.OpenLesson
        //     );
        // const createdPlanLessons =
        //     await aiChatService.getNumberOfCreatedChatsForLast24Hours(
        //         AiChatType.PlanLesson
        //     );
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);


        //TODO change on real (Features Statistic)
        const message = `
🆕 New Users:
D1  - ${newUsersByDay[1]}
D7  - ${newUsersByDay[7]}
D14 - ${newUsersByDay[14]}
D30 - ${newUsersByDay[30]}
        `.trim();

        // Отправляем статистику только если Telegram настроен
        if (config.TG_STATISTICS.TOKEN && config.TG_STATISTICS.CHAT_ID) {
            TgApi.sendMessage(Number(config.TG_STATISTICS.CHAT_ID), message);
        }
    } catch (error) {
        elevateError(error);
    }
};
