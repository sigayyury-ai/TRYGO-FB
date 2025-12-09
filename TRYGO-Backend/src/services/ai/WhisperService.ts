import {
    TranscriptionCreateParams,
    TranscriptionCreateParamsNonStreaming,
} from 'openai/resources/audio/transcriptions';
import { openai } from '../../configuration/openai';

class WhisperService {
    async transcribeAudio(
        urlToFile: string,
        language?: string
    ): Promise<string> {
        try {
            const response = await fetch(urlToFile);
            const arrayBuffer = await response.arrayBuffer();
            const fileType = urlToFile.split('.').pop();
            const file = new File([arrayBuffer], `audio.${fileType}`);

            const params = {
                file,
                model: 'whisper-1',
            } as TranscriptionCreateParamsNonStreaming;

            if (language && language !== 'auto') {
                params.language = language;
            }

            const transcription =
                await openai.audio.transcriptions.create(params);
            return transcription.text;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

const whisperService = new WhisperService();
export default whisperService;
