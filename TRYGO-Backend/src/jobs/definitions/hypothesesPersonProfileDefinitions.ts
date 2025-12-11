import Agenda, { Job } from 'agenda';
import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesPersonProfileService from '../../services/HypothesesPersonProfileService';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import projectService from '../../services/ProjectService';
import { CustomerSegment } from '../../generated/graphql';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';

const hypothesesPersonProfileDefinitions = (agenda: Agenda) => {
    agenda.define('createHypothesesPersonProfile', async (job: Job) => {
        try {
            const { userId, customerSegment, projectHypothesisId } = job.attrs
                .data as {
                userId: string;
                customerSegment: CustomerSegment;
                projectHypothesisId: string;
            };
            console.log('createHypothesesPersonProfile', job.attrs.data);
            const projectHypothesis =
                await projectHypothesesService.getProjectHypothesisByIdWithCheck(
                    projectHypothesisId,
                    userId
                );
            const project = await projectService.getProjectById(
                projectHypothesis.projectId.toString(),
                userId
            );
            console.log('projectHypothesis', projectHypothesis);

            const prompt = prompts.createPersonProfile(
                projectHypothesis,
                customerSegment
            );
            console.log('prompt', prompt);

            const gptResponse = await chatGPTService.createAnswerWithAssistantJsonSchema(
                JsonSchemaType.PERSON_PROFILE,
                prompt,
                project.assistantId,
                20000
            );
            console.log('gptResponse', gptResponse);
            const gptPersonProfile = gptResponse.response.response;
            console.log('gptPersonProfile', gptPersonProfile);

            await hypothesesPersonProfileService.createHypothesesPersonProfile({
                ...gptPersonProfile,
                projectHypothesisId: projectHypothesisId,
                userId,
                customerSegmentId: customerSegment.id,
            });
        } catch (err) {
            console.error(err);
        }
    });
};

export default hypothesesPersonProfileDefinitions;
