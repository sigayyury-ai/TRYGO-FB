/**
 * Frontend Logger - отправляет логи на бэкенд
 * Используется для отладки и мониторинга фронтенда
 */

import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";
import { gql } from "@apollo/client";

const LOG_FRONTEND_MESSAGE = gql`
  mutation LogFrontendMessage($level: String!, $message: String!, $data: String) {
    logFrontendMessage(level: $level, message: $message, data: $data)
  }
`;

// Префиксы логов, которые нужно отправлять на бэкенд
const LOG_PREFIXES = [
  '[SeoContentPanel]',
  '[seoAgentClient]',
  '[SeoAgentPage]',
  '[useProjectStore]',
  '[useHypothesisStore]',
];

// Флаг для включения/выключения отправки логов
// Отключаем по умолчанию для производительности - можно включить через setLoggingEnabled(true)
let loggingEnabled = false; // Отключено по умолчанию для предотвращения утечек памяти

/**
 * Отправляет лог на бэкенд
 */
async function sendLogToBackend(level: string, message: string, data?: any) {
  if (!loggingEnabled) return;
  
  try {
    let dataString: string | undefined;
    if (data) {
      const jsonString = JSON.stringify(data);
      // Truncate data if it's too large (limit to 100KB to avoid 413 errors)
      const MAX_DATA_SIZE = 100 * 1024; // 100KB
      if (jsonString.length > MAX_DATA_SIZE) {
        dataString = jsonString.substring(0, MAX_DATA_SIZE) + `... [truncated, original size: ${jsonString.length} bytes]`;
      } else {
        dataString = jsonString;
      }
    }
    
    await SEO_AGENT_MUTATE({
      mutation: LOG_FRONTEND_MESSAGE,
      variables: {
        level,
        message,
        data: dataString,
      },
    });
  } catch (error) {
    // Не логируем ошибки отправки логов, чтобы избежать бесконечного цикла
    // Просто игнорируем
  }
}

/**
 * Проверяет, нужно ли отправлять лог на бэкенд
 */
function shouldSendLog(message: string): boolean {
  if (!loggingEnabled) return false;
  
  return LOG_PREFIXES.some(prefix => message.includes(prefix));
}

/**
 * Инициализирует перехватчик console
 */
export function initFrontendLogger() {
  if (typeof window === 'undefined') return;
  
  // Сохраняем оригинальные функции
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  
  // Перехватываем console.log
  console.log = (...args: any[]) => {
    originalLog.apply(console, args);
    
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    if (shouldSendLog(message)) {
      sendLogToBackend('log', message, args.length > 1 ? args : undefined);
    }
  };
  
  // Перехватываем console.error
  console.error = (...args: any[]) => {
    originalError.apply(console, args);
    
    const message = args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack}`;
      }
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    if (shouldSendLog(message)) {
      sendLogToBackend('error', message, args.length > 1 ? args : undefined);
    }
  };
  
  // Перехватываем console.warn
  console.warn = (...args: any[]) => {
    originalWarn.apply(console, args);
    
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    if (shouldSendLog(message)) {
      sendLogToBackend('warn', message, args.length > 1 ? args : undefined);
    }
  };
  
  // Перехватываем console.info
  console.info = (...args: any[]) => {
    originalInfo.apply(console, args);
    
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    if (shouldSendLog(message)) {
      sendLogToBackend('info', message, args.length > 1 ? args : undefined);
    }
  };
  
  console.log('[FrontendLogger] ✅ Logger initialized');
}

/**
 * Включает/выключает отправку логов
 */
export function setLoggingEnabled(enabled: boolean) {
  loggingEnabled = enabled;
}

