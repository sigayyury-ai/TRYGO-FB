import { Socket } from 'socket.io';
import hypothesesCoreService from '../../services/HypothesesCoreService';
import chatGPTService from '../../services/ai/ChatGPTService';
import projectService from '../../services/ProjectService';
import { EVENT_NAMES } from '../../constants/socketIO/eventNames';
import { prompts } from '../../constants/aIntelligence/prompts';
import { createLeanCanvasMessage } from './createLeanCanvasMessage';
import { createPersonProfileMessage } from './createPersonProfileMessage';
import { createMarketResearchMessage } from './createMarketResearchMessage';
import { createValidationMessage } from './createValidationMessage';
import { createPackingMessage } from './createPackingMessage';
import { createGtmMessage } from './createGtmMessage';
import { createGtmDetailedChannelMessage } from './createGtmDetailedChannelMessage';
import { checkIfMessagesAllowed } from '../subscription/checkIfMessagesAllowed';
import assistantMessagesService from '../../services/AssistantMessagesService';

export interface CreateMessageInput {
    message: string;
    projectHypothesisId: string;
    projectId: string;
    messageType: MessageType;
    wantToChangeInfo: boolean;
    id?: string;
    customerSegmentId?: string;
    hypothesesGtmChannelId?: string;
}

export interface AnswerCreatedEvent {
    message: string;
    id?: string;
}

export enum MessageType {
    ABOUT_LEAN_CANVAS = 'ABOUT_LEAN_CANVAS',
    ABOUT_MARKET_RESEARCH = 'ABOUT_MARKET_RESEARCH',
    ABOUT_PERSON_PROFILE = 'ABOUT_PERSON_PROFILE',
    ABOUT_VALIDATION = 'ABOUT_VALIDATION',
    ABOUT_PACKING = 'ABOUT_PACKING',
    ABOUT_GTM = 'ABOUT_GTM',
    ABOUT_GTM_DETAILED_CHANNEL = 'ABOUT_GTM_DETAILED_CHANNEL',
}

export const createMessage = async ({
    socket,
    input,
    userId,
}: {
    socket: Socket;
    input: CreateMessageInput;
    userId: string;
}) => {
    try {
        console.log('[createMessage] Начало обработки сообщения:', {
            messageType: input.messageType,
            projectId: input.projectId,
            hypothesisId: input.projectHypothesisId,
            userId,
        });

        await checkIfMessagesAllowed(userId);
        console.log('[createMessage] Проверка подписки пройдена');

        let message = '';
        switch (input.messageType) {
            case MessageType.ABOUT_LEAN_CANVAS:
                console.log('[createMessage] Обработка ABOUT_LEAN_CANVAS');
                message = await createLeanCanvasMessage(input, userId);
                break;
            case MessageType.ABOUT_MARKET_RESEARCH:
                console.log('[createMessage] Обработка ABOUT_MARKET_RESEARCH');
                message = await createMarketResearchMessage(input, userId);
                break;
            case MessageType.ABOUT_PERSON_PROFILE:
                console.log('[createMessage] Обработка ABOUT_PERSON_PROFILE');
                message = await createPersonProfileMessage(input, userId);
                break;
            case MessageType.ABOUT_VALIDATION:
                console.log('[createMessage] Обработка ABOUT_VALIDATION');
                message = await createValidationMessage(input, userId);
                break;
            case MessageType.ABOUT_PACKING:
                console.log('[createMessage] Обработка ABOUT_PACKING');
                message = await createPackingMessage(input, userId);
                break;
            case MessageType.ABOUT_GTM:
                console.log('[createMessage] Обработка ABOUT_GTM');
                message = await createGtmMessage(input, userId);
                break;
            case MessageType.ABOUT_GTM_DETAILED_CHANNEL:
                console.log('[createMessage] Обработка ABOUT_GTM_DETAILED_CHANNEL');
                message = await createGtmDetailedChannelMessage(input, userId);
                break;
            default:
                throw new Error(`Invalid message type: ${input.messageType}`);
        }

        console.log('[createMessage] Сообщение сгенерировано, длина:', message?.length || 0);

        await assistantMessagesService.incrementGeneratedMessages(userId);

        console.log('[createMessage] Отправка ответа клиенту');
        socket.emit(EVENT_NAMES.answerCreated, {
            message,
            id: input.id,
        });
        
        console.log('[createMessage] Ответ успешно отправлен');
    } catch (error) {
        console.error('[createMessage] ОШИБКА при обработке сообщения:', error);
        console.error('[createMessage] Детали ошибки:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined,
        });
        
        // Отправляем ошибку клиенту
        socket.emit(EVENT_NAMES.answerCreated, {
            message: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}. Пожалуйста, попробуйте еще раз.`,
            id: input.id,
        });
    }
};
