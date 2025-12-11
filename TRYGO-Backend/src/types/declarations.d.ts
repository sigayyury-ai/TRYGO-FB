// Type declarations for modules that don't have @types packages or have issues

declare module 'node-telegram-bot-api' {
    export interface SendMessageOptions {
        parse_mode?: string;
        disable_web_page_preview?: boolean;
        disable_notification?: boolean;
        reply_to_message_id?: number;
        reply_markup?: any;
    }

    export interface SendPhotoOptions {
        caption?: string;
        parse_mode?: string;
        reply_markup?: any;
    }

    export interface InlineKeyboardButton {
        text: string;
        url?: string;
        callback_data?: string;
    }

    export interface Message {
        message_id: number;
        from?: any;
        date: number;
        chat: any;
        text?: string;
    }
    

    export default class TelegramBot {
        constructor(token: string, options?: any);
        sendMessage(chatId: number, text: string, options?: SendMessageOptions): Promise<Message>;
        sendPhoto(chatId: number, photo: string, options?: SendPhotoOptions): Promise<Message>;
        on(event: string, callback: (msg: Message) => void): void;
    }
}

declare module 'multer' {
    import { Request } from 'express';
    
    export interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
    }

    export interface Multer {
        (options?: any): any;
        memoryStorage(): any;
        diskStorage(options: any): any;
    }

    const multer: Multer;
    export default multer;
}

declare module 'bcrypt' {
    export function genSalt(rounds: number): Promise<string>;
    export function hash(data: string, salt: string): Promise<string>;
    export function compare(data: string, encrypted: string): Promise<boolean>;
    
    const bcrypt: {
        genSalt: typeof genSalt;
        hash: typeof hash;
        compare: typeof compare;
    };
    
    export default bcrypt;
}

// Extend Express namespace for Multer
declare namespace Express {
    namespace Multer {
        interface File {
            fieldname: string;
            originalname: string;
            encoding: string;
            mimetype: string;
            size: number;
            destination: string;
            filename: string;
            path: string;
            buffer: Buffer;
        }
    }
    
    interface Request {
        file?: Express.Multer.File;
        files?: Express.Multer.File[];
    }
}

declare module 'jsonwebtoken' {
    export interface SignOptions {
        expiresIn?: string | number;
        algorithm?: string;
        issuer?: string;
        subject?: string;
        audience?: string;
    }
    
    export interface VerifyOptions {
        algorithms?: string[];
        issuer?: string;
        subject?: string;
        audience?: string;
    }
    
    export interface JwtPayload {
        [key: string]: any;
        id?: string;
        email?: string;
        iat?: number;
        exp?: number;
    }
    
    export function sign(payload: string | object | Buffer, secretOrPrivateKey: string, options?: SignOptions): string;
    export function verify(token: string, secretOrPublicKey: string, options?: VerifyOptions): JwtPayload | string;
    export function decode(token: string, options?: any): JwtPayload | string | null;
}
