/**
 * EXAMPLE SERVICE USAGE
 * 
 * Цей файл демонструє практичне використання нової JSON Schema системи
 * в різних сценаріях.
 * 
 * ВАЖЛИВО: Це приклади для ілюстрації. Не запускайте цей файл напряму.
 */

import chatGPTService from './src/services/ai/ChatGPTService';
import { JsonSchemaType } from './src/types/ChatGPT/JsonSchemaTypes';
import { prompts } from './src/constants/aIntelligence/prompts';

// ============================================================================
// ПРИКЛАД 1: Генерація гіпотез проекту
// ============================================================================

async function exampleGenerateProjectHypotheses(isFirstProject: boolean) {
    try {
        const result = await chatGPTService.generateMessageWithJsonSchema(
            JsonSchemaType.PROJECT_HYPOTHESES,
            prompts.createProjectHypotheses(isFirstProject),
            20000
        );

        // Результат має структуру: { hypotheses: Array<{ title, description }> }
        console.log('Generated hypotheses:', result.hypotheses);
        
        // Обробка кожної гіпотези
        for (const hypothesis of result.hypotheses) {
            console.log('Title:', hypothesis.title);
            console.log('Description:', hypothesis.description);
        }
        
        return result.hypotheses;
    } catch (error) {
        console.error('Error generating hypotheses:', error);
        throw error;
    }
}

// ============================================================================
// ПРИКЛАД 2: Створення ядра гіпотези з профілями персон
// ============================================================================

async function exampleCreateHypothesesCore(projectHypothesis: any) {
    try {
        const result = await chatGPTService.generateMessageWithJsonSchema(
            JsonSchemaType.HYPOTHESES_CORE_WITH_PERSON_PROFILES,
            prompts.createHypothesesCoreWithPersonProfiles(projectHypothesis),
            20000
        );

        // Результат має структуру: { response: { problems, customerSegments, ... } }
        const coreData = result.response;
        
        console.log('Problems:', coreData.problems);
        console.log('Customer segments:', coreData.customerSegments);
        console.log('Unique proposition:', coreData.uniqueProposition);
        
        // Обробка кожного customer segment з вбудованим personProfile
        for (const segment of coreData.customerSegments) {
            console.log('Segment:', segment.name);
            console.log('Person profile:', segment.personProfile.name);
            console.log('Age:', segment.personProfile.age);
        }
        
        return coreData;
    } catch (error) {
        console.error('Error creating hypotheses core:', error);
        throw error;
    }
}

// ============================================================================
// ПРИКЛАД 3: Створення повідомлення з можливістю зміни даних
// ============================================================================

async function exampleCreateLeanCanvasMessage(
    userMessage: string,
    hypothesesCore: any,
    shouldUpdateData: boolean
) {
    try {
        const result = await chatGPTService.generateMessageWithJsonSchema(
            JsonSchemaType.LEAN_CANVAS_MESSAGE,
            prompts.createLeanCanvasMessage(userMessage, hypothesesCore, shouldUpdateData),
            20000,
            { wantToChangeInfo: shouldUpdateData }
        );

        const responseData = result.response;
        
        // Завжди буде повідомлення
        console.log('AI Message:', responseData.message);
        
        // Якщо wantToChangeInfo: true, будуть також оновлені дані
        if (shouldUpdateData) {
            console.log('Updated problems:', responseData.problems);
            console.log('Updated solutions:', responseData.solutions);
            // ... інші поля
            
            return {
                message: responseData.message,
                updatedData: {
                    problems: responseData.problems,
                    customerSegments: responseData.customerSegments,
                    uniqueProposition: responseData.uniqueProposition,
                    solutions: responseData.solutions,
                    keyMetrics: responseData.keyMetrics,
                    channels: responseData.channels,
                    costStructure: responseData.costStructure,
                    revenueStream: responseData.revenueStream,
                    unfairAdvantages: responseData.unfairAdvantages,
                },
            };
        }
        
        return { message: responseData.message };
    } catch (error) {
        console.error('Error creating lean canvas message:', error);
        throw error;
    }
}

// ============================================================================
// ПРИКЛАД 4: Аналіз інтерв'ю з клієнтами
// ============================================================================

async function exampleAnalyzeCustomerInterviews(interviewText: string) {
    try {
        const result = await chatGPTService.generateMessageWithJsonSchema(
            JsonSchemaType.VALIDATION_INSIGHTS_CUSTOMER_INTERVIEWS,
            prompts.createValidationInsightsCustomerInterviews(interviewText),
            20000
        );

        const analysisData = result.response;
        
        console.log('Insights:', analysisData.insightsCustomerInterviews);
        console.log('Goals:', analysisData.summaryInterview.goals);
        console.log('Pains:', analysisData.summaryInterview.pains);
        console.log('Hypotheses validation:', analysisData.summaryInterview.hypotheses);
        console.log('Recommended tone:', analysisData.summaryInterview.toneOfVoice);
        
        return analysisData;
    } catch (error) {
        console.error('Error analyzing interviews:', error);
        throw error;
    }
}

// ============================================================================
// ПРИКЛАД 5: Створення GTM стратегії
// ============================================================================

async function exampleCreateGTMStrategy(projectHypothesis: any) {
    try {
        const result = await chatGPTService.generateMessageWithJsonSchema(
            JsonSchemaType.HYPOTHESES_GTM,
            prompts.createHypothesesGtm(projectHypothesis),
            20000
        );

        const gtmData = result.response;
        
        console.log('=== Validate Stage ===');
        console.log('Stage name:', gtmData.stageValidate.name);
        for (const channel of gtmData.stageValidate.channels) {
            console.log(`Channel: ${channel.name} (${channel.type})`);
            console.log(`Strategy: ${channel.strategy}`);
            console.log(`KPIs: ${channel.kpis}`);
        }
        
        console.log('=== Build Audience Stage ===');
        for (const channel of gtmData.stageBuildAudience.channels) {
            console.log(`Channel: ${channel.name}`);
        }
        
        console.log('=== Scale Stage ===');
        for (const channel of gtmData.stageScale.channels) {
            console.log(`Channel: ${channel.name}`);
        }
        
        return gtmData;
    } catch (error) {
        console.error('Error creating GTM strategy:', error);
        throw error;
    }
}

// ============================================================================
// ПРИКЛАД 6: Детальний план для каналу
// ============================================================================

async function exampleCreateDetailedChannelPlan(
    projectHypothesis: any,
    customerSegment: any,
    channel: any
) {
    try {
        const result = await chatGPTService.generateMessageWithJsonSchema(
            JsonSchemaType.HYPOTHESES_GTM_DETAILED_CHANNEL,
            prompts.createHypothesesGtmDetailedChannel(
                projectHypothesis,
                customerSegment,
                channel
            ),
            20000
        );

        const detailedPlan = result.response;
        
        console.log('Strategy:', detailedPlan.channelStrategy);
        
        console.log('Preparation tasks:');
        for (const task of detailedPlan.channelPreparationTasks) {
            console.log(`- ${task.text} [${task.isCompleted ? '✓' : ' '}]`);
        }
        
        console.log('Tools needed:');
        console.log(detailedPlan.tools);
        
        console.log('Content ideas:');
        for (const idea of detailedPlan.contentIdeas) {
            console.log(`${idea.title}: ${idea.text}`);
        }
        
        console.log('Action plan:');
        for (const stage of detailedPlan.actionPlan) {
            console.log(`${stage.stageTitle}:`);
            for (const task of stage.tasks) {
                console.log(`  - ${task.text}`);
            }
        }
        
        console.log('Metrics & KPIs:', detailedPlan.metricsAndKpis);
        
        return detailedPlan;
    } catch (error) {
        console.error('Error creating detailed channel plan:', error);
        throw error;
    }
}

// ============================================================================
// ПРИКЛАД 7: Генерація ідей контенту
// ============================================================================

async function exampleGenerateContentIdea(hypothesesGtmDetailedChannel: any) {
    try {
        const result = await chatGPTService.generateMessageWithJsonSchema(
            JsonSchemaType.GENERATE_CONTENT_IDEA,
            prompts.generateContentIdea(hypothesesGtmDetailedChannel),
            20000
        );

        const contentIdea = result.response;
        
        console.log('New content idea:');
        console.log('Title:', contentIdea.title);
        console.log('Text:', contentIdea.text);
        
        return contentIdea;
    } catch (error) {
        console.error('Error generating content idea:', error);
        throw error;
    }
}

// ============================================================================
// ПРИКЛАД 8: Використання в сервісі (повний приклад)
// ============================================================================

class ExampleHypothesesService {
    /**
     * Створення маркетингового дослідження для гіпотези
     */
    async createMarketResearch(projectHypothesisId: string, userId: string) {
        try {
            // 1. Отримати дані про гіпотезу
            const projectHypothesis = await this.getProjectHypothesis(projectHypothesisId, userId);
            
            // 2. Згенерувати дослідження за допомогою JSON Schema
            const result = await chatGPTService.generateMessageWithJsonSchema(
                JsonSchemaType.HYPOTHESES_MARKET_RESEARCH,
                prompts.createHypothesesMarketResearch(projectHypothesis),
                20000
            );
            
            // 3. Зберегти результат в базу даних
            const savedResearch = await this.saveMarketResearch({
                projectHypothesisId,
                userId,
                summary: result.response.summary,
            });
            
            return savedResearch;
        } catch (error) {
            console.error('Error creating market research:', error);
            throw error;
        }
    }
    
    /**
     * Обробка повідомлення користувача з можливістю оновлення даних
     */
    async handleUserMessage(
        messageText: string,
        marketResearchId: string,
        userId: string,
        shouldUpdateData: boolean
    ) {
        try {
            // 1. Отримати поточне дослідження
            const currentResearch = await this.getMarketResearch(marketResearchId, userId);
            
            // 2. Створити відповідь з можливістю оновлення даних
            const result = await chatGPTService.generateMessageWithJsonSchema(
                JsonSchemaType.MARKET_RESEARCH_MESSAGE,
                prompts.createMarketResearchMessage(
                    messageText,
                    currentResearch,
                    shouldUpdateData
                ),
                20000,
                { wantToChangeInfo: shouldUpdateData }
            );
            
            const responseData = result.response;
            
            // 3. Якщо потрібно оновити дані
            if (shouldUpdateData && responseData.summary) {
                await this.updateMarketResearch(marketResearchId, {
                    summary: responseData.summary,
                });
            }
            
            return {
                message: responseData.message,
                updatedSummary: shouldUpdateData ? responseData.summary : null,
            };
        } catch (error) {
            console.error('Error handling user message:', error);
            throw error;
        }
    }
    
    // Заглушки для демонстрації
    private async getProjectHypothesis(id: string, userId: string): Promise<any> {
        // Implementation would fetch from database
        return {};
    }
    
    private async saveMarketResearch(data: any): Promise<any> {
        // Implementation would save to database
        return data;
    }
    
    private async getMarketResearch(id: string, userId: string): Promise<any> {
        // Implementation would fetch from database
        return {};
    }
    
    private async updateMarketResearch(id: string, data: any): Promise<any> {
        // Implementation would update in database
        return data;
    }
}

// ============================================================================
// ПРИКЛАД 9: Обробка помилок та валідація
// ============================================================================

async function exampleWithErrorHandling(projectHypothesis: any) {
    try {
        const result = await chatGPTService.generateMessageWithJsonSchema(
            JsonSchemaType.HYPOTHESES_PACKING,
            prompts.createHypothesesPacking(projectHypothesis),
            20000
        );

        // JSON Schema гарантує структуру, але перевірка не завадить
        if (!result.response || !result.response.summary) {
            throw new Error('Invalid response structure');
        }
        
        const summary = result.response.summary;
        
        // Валідація довжини
        if (summary.length < 100) {
            console.warn('Summary is too short');
        }
        
        return summary;
    } catch (error) {
        console.error('Error creating packing:', error);
        
        // Обробка різних типів помилок
        if (error instanceof Error) {
            if (error.message.includes('Invalid response')) {
                // Специфічна обробка для проблем зі структурою
                console.error('Response validation failed');
            } else if (error.message.includes('timeout')) {
                // Обробка таймауту
                console.error('Request timed out');
            }
        }
        
        throw error;
    }
}

// ============================================================================
// ЕКСПОРТ ПРИКЛАДІВ
// ============================================================================

export const examples = {
    exampleGenerateProjectHypotheses,
    exampleCreateHypothesesCore,
    exampleCreateLeanCanvasMessage,
    exampleAnalyzeCustomerInterviews,
    exampleCreateGTMStrategy,
    exampleCreateDetailedChannelPlan,
    exampleGenerateContentIdea,
    ExampleHypothesesService,
    exampleWithErrorHandling,
};

/**
 * ============================================================================
 * КОРОТКЕ РЕЗЮМЕ ДЛЯ КОЖНОГО ТИПУ
 * ============================================================================
 * 
 * 1. PROJECT_HYPOTHESES
 *    Вхід: isFirstProject
 *    Вихід: { hypotheses: Array<{ title, description }> }
 * 
 * 2. HYPOTHESES_CORE_WITH_PERSON_PROFILES
 *    Вхід: projectHypothesis
 *    Вихід: { response: { problems, customerSegments, uniqueProposition, ... } }
 * 
 * 3. PERSON_PROFILE
 *    Вхід: projectHypothesis, customerSegment
 *    Вихід: { response: { name, description, platforms, age, ... } }
 * 
 * 4. LEAN_CANVAS_MESSAGE
 *    Вхід: message, hypothesesCore, wantToChangeInfo
 *    Config: { wantToChangeInfo }
 *    Вихід: { response: { message, ...оновлені поля якщо wantToChangeInfo: true } }
 * 
 * 5. HYPOTHESES_MARKET_RESEARCH
 *    Вхід: projectHypothesis
 *    Вихід: { response: { summary } }
 * 
 * 6. HYPOTHESES_VALIDATION
 *    Вхід: projectHypothesis
 *    Вихід: { response: { validationChannels, customerInterviewQuestions } }
 * 
 * 7. VALIDATION_INSIGHTS_CUSTOMER_INTERVIEWS
 *    Вхід: customerInterview
 *    Вихід: { response: { insightsCustomerInterviews, summaryInterview } }
 * 
 * 8. HYPOTHESES_GTM
 *    Вхід: projectHypothesis
 *    Вихід: { response: { stageValidate, stageBuildAudience, stageScale } }
 * 
 * 9. HYPOTHESES_GTM_DETAILED_CHANNEL
 *    Вхід: projectHypothesis, customerSegment, channel
 *    Вихід: { response: { channelStrategy, channelPreparationTasks, tools, ... } }
 * 
 * 10. GENERATE_CONTENT_IDEA
 *     Вхід: hypothesesGtmDetailedChannel
 *     Вихід: { response: { title, text } }
 * 
 * ============================================================================
 */

