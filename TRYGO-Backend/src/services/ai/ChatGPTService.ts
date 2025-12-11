import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources';
import { prompts } from '../../constants/aIntelligence/prompts';
import {
    getInputGenerationSmart,
    getInputGenerationBasedOnSearch,
    parseJsonFromResponse,
    getInputGenerationBasic,
} from '../../utils';
import { elevateError } from '../../errors/elevateError';
import { openai } from '../../configuration/openai';
import { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';
import { getJsonSchemaForType } from '../../utils/aIntelligence/jsonSchemas';

class ChatGPTService {
    async createAnswerBasedOnSearch(prompt: string) {
        try {
            const gptInput = getInputGenerationBasedOnSearch(prompt);
            console.log('prompt', prompt);
            const response = await this.chatGPTRequest(
                gptInput as ChatCompletionCreateParamsNonStreaming
            );
            console.log('response', response);
            const parsedResponse = await parseJsonFromResponse(response);
            console.log(
                'createAnswerBasedOnSearch -> response',
                parsedResponse
            );

            return parsedResponse;
        } catch (error) {
            elevateError(error);
        }
    }

    async createAnswerWithBasicVersion(
        prompt: string,
        max_tokens: number = 5000
    ) {
        try {
            const content = await this.chatGPTRequestBasic(prompt, max_tokens);

            const response = await parseJsonFromResponse(content);
            console.log('createActivityTaskWithPrompt -> response', response);

            return response;
        } catch (error) {
            elevateError(error);
        }
    }

    async createAnswerWithSmartVersion(
        prompt: string,
        max_tokens: number = 1000
    ) {
        try {
            const content = await this.chatGPTRequestSmart(prompt, max_tokens);

            const response = await parseJsonFromResponse(content);
            console.log('createActivityTaskWithPrompt -> response', response);

            return response;
        } catch (error) {
            elevateError(error);
        }
    }

    async createThread() {
        try {
            const thread = await openai.beta.threads.create();
            return thread;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async chatGPTRequestSmart(
        prompt: string,
        max_tokens: number = 10000
    ): Promise<string> {
        try {
            const gptInput = getInputGenerationSmart(prompt, max_tokens);

            return await this.chatGPTRequest(
                gptInput as ChatCompletionCreateParamsNonStreaming
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async createAssistant(instructions: string, userId: string) {
        try {
            const myAssistant = await openai.beta.assistants.create({
                instructions,
                name: `Project Assistant for ${userId}`,
                model: 'gpt-4.1-mini',
                response_format: {
                    type: 'json_object',
                },
            });

            return myAssistant.id;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async getRunObjectStatus(threadId: string, runId: string) {
        try {
            const runObject = await openai.beta.threads.runs.retrieve(runId, {
                thread_id: threadId,
            });

            return runObject.status;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async createAnswerWithAssistant(prompt: string, assistantId: string) {
        try {
            const thread = await this.createThread();
            await this.createThreadMessage(thread.id, prompt);

            const run = await this.createRun(thread.id, assistantId);

            const response = await this.getMessageInThread(thread.id, run.id);

            return {
                threadId: thread.id,
                response,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async createAnswerWithThread(
        assistantId: string,
        threadId: string,
        prompt: string
    ) {
        try {
            await this.createThreadMessage(threadId, prompt);
            const run = await this.createRun(threadId, assistantId);
            return await this.getMessageInThread(threadId, run.id);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getAssistant(assistantId: string) {
        try {
            return await openai.beta.assistants.retrieve(assistantId);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async changeAssistant(assistantId: string, systemInstruction: string) {
        try {
            return await openai.beta.assistants.update(assistantId, {
                instructions: systemInstruction,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async getMessageInThread(threadId: string, runId: string) {
        try {
            const startTime = Date.now();
            const timeout = 60000;

            let runObjectStatus = 'pending';

            while (
                Date.now() - startTime < timeout &&
                runObjectStatus != 'completed'
            ) {
                runObjectStatus = await this.getRunObjectStatus(
                    threadId,
                    runId
                );

                if (runObjectStatus == 'completed') {
                    return await this.getCompletedMessage(threadId);
                }

                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            throw new Error(
                'Timeout: The operation did not complete within 1 minute.'
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async getCompletedMessage(threadId: string) {
        try {
            const messagesList = (await openai.beta.threads.messages.list(
                threadId
            )) as any;
            const messages = [] as any[];

            messagesList.body.data.forEach((message: any) => {
                messages.push(message.content);
            });

            console.log('messages', messages);

            const response = await parseJsonFromResponse(
                messages[0][0].text.value
            );
            console.log('response', response);

            return response;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async createThreadMessage(threadId: string, prompt: string) {
        try {
            await openai.beta.threads.messages.create(threadId, {
                role: 'user',
                content: prompt,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async createRun(threadId: string, assistantId: string, responseFormat?: any) {
        try {
            const runParams: any = {
                assistant_id: assistantId,
            };
            
            if (responseFormat) {
                runParams.response_format = responseFormat;
            }

            console.log('runParams', runParams);
            
            return await openai.beta.threads.runs.create(threadId, runParams);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async chatGPTRequestBasic(
        prompt: string,
        max_tokens: number
    ): Promise<string> {
        try {
            const gptInput = getInputGenerationBasic(prompt, max_tokens);

            return await this.chatGPTRequestResponse(
                gptInput as ResponseCreateParamsNonStreaming
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async chatGPTRequest(
        gptInput: ChatCompletionCreateParamsNonStreaming
    ): Promise<string> {
        try {
            const response = await openai.chat.completions.create(gptInput);
            const [choice] = response.choices;

            if (!choice.message || !choice.message.content) {
                throw new Error('Failed to get a response from the GPT model.');
            }

            return choice.message.content;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async chatGPTRequestResponse(
        gptInput: ResponseCreateParamsNonStreaming
    ): Promise<string> {
        try {
            const response = await openai.responses.create(gptInput);
            console.log('response', response);
            return response.output_text;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async generateMessageWithJsonSchema(
        schemaType: JsonSchemaType,
        prompt: string,
        maxTokens: number = 20000,
        config?: {
            wantToChangeInfo?: boolean;
            hasSummaryInterview?: boolean;
        }
    ): Promise<any> {
        try {
            const gptInput = getJsonSchemaForType(
                schemaType,
                prompt,
                maxTokens,
                config
            );

            const response = await this.chatGPTRequestResponse(
                gptInput as ResponseCreateParamsNonStreaming
            );
            console.log('generateMessageWithJsonSchema response', response);
            return JSON.parse(response);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async createAnswerWithAssistantJsonSchema(
        schemaType: JsonSchemaType,
        prompt: string,
        assistantId: string,
        maxTokens: number = 20000,
        config?: {
            wantToChangeInfo?: boolean;
            hasSummaryInterview?: boolean;
        }
    ): Promise<{ response: any; threadId: string }> {
        try {
            const gptInput = getJsonSchemaForType(
                schemaType,
                prompt,
                maxTokens,
                config
            );

            // Transform format for Assistant API
            const format = gptInput.text.format as any;
            const responseFormat: any = {
                type: format.type,
                json_schema: {
                    name: format.name,
                    strict: format.strict,
                    schema: format.schema,
                },
            };
            
            const thread = await this.createThread();
            await this.createThreadMessage(thread.id, prompt);
            const run = await this.createRun(thread.id, assistantId, responseFormat);
            const response = await this.getMessageInThread(thread.id, run.id);

            return {
                response,
                threadId: thread.id,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async createAnswerWithThreadJsonSchema(
        schemaType: JsonSchemaType,
        prompt: string,
        assistantId: string,
        threadId: string,
        maxTokens: number = 20000,
        config?: {
            wantToChangeInfo?: boolean;
            hasSummaryInterview?: boolean;
        }
    ): Promise<any> {
        try {
            const gptInput = getJsonSchemaForType(
                schemaType,
                prompt,
                maxTokens,
                config
            );

            // Transform format for Assistant API
            const responseFormat: any = {
                type: gptInput.text.format.type,
                json_schema: {
                    name: gptInput.text.format.name,
                    strict: gptInput.text.format.strict,
                    schema: (gptInput.text.format as any).schema,
                },
            };
            console.log('responseFormat', responseFormat);
            
            await this.createThreadMessage(threadId, prompt);
            const run = await this.createRun(threadId, assistantId, responseFormat);
            const response = await this.getMessageInThread(threadId, run.id);

            return response;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const chatGPTService = new ChatGPTService();
export default chatGPTService;
