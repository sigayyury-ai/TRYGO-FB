import { prompts } from '../constants/aIntelligence/prompts';
import { elevateError } from '../errors/elevateError';
import HypothesesCoreModel from '../models/HypothesesCoreModel';
import HypothesesPersonProfileModel from '../models/HypothesesPersonProfileModel';
import ProjectHypothesisModel from '../models/ProjectHypothesisModel';
import ProjectModel from '../models/ProjectModel';
import chatGPTService from '../services/ai/ChatGPTService';
import hypothesesCoreService from '../services/HypothesesCoreService';
import hypothesesPersonProfileService from '../services/HypothesesPersonProfileService';
import projectHypothesesService from '../services/ProjectHypothesesService';
import projectService from '../services/ProjectService';


class MigrationService {
    async updateHypothesesPersonProfile() {
        try {
            //now using for adding cjm and jbtd
            const hypothesesPersonProfiles =
                await HypothesesPersonProfileModel.find({
                    jbtd: { $exists: false },
                    createdAt: {$gte: new Date('2025-07-10T07:24:14.611+00:00')}
                });
            console.log(
                'hypothesesPersonProfiles',
                hypothesesPersonProfiles.length
            );
            const wantToChangeInfo = true;
            const messageForCorrection = 'Add all missing fields in ICP';

            for (const hypothesesPersonProfile of hypothesesPersonProfiles) {
                const userId = hypothesesPersonProfile.userId.toString();
                const projectHypothesisId =
                    hypothesesPersonProfile.projectHypothesisId.toString();

                const projectHypotheses = await ProjectHypothesisModel.findOne({
                    _id: hypothesesPersonProfile.projectHypothesisId.toString(),
                    userId,
                });
                if (!projectHypotheses) {
                    console.log('skip !projectHypotheses', userId);
                    continue;
                }
                const project = await ProjectModel.findOne({
                    _id: projectHypotheses.projectId.toString(),
                    userId,
                });
                if (!project) {
                    console.log('skip !project', userId);
                    continue;
                }
                // const hypothesesCore =
                //     await hypothesesCoreService.getHypothesesCore(
                //         projectHypothesisId,
                //         userId
                //     );
                const hypothesesCore = await HypothesesCoreModel.findOne({
                    projectHypothesisId,
                    userId,
                });
                if (!hypothesesCore) {
                    console.log('skip !hypothesesCore', userId);
                    continue;
                }

                const customerSegment = hypothesesCore.customerSegments.find(
                    (customerSegment) =>
                        customerSegment._id.toString() ===
                        hypothesesPersonProfile?.customerSegmentId?.toString()
                );
                if (!customerSegment) {
                    console.log('skip !customerSegment', userId);
                    continue;
                }

                const prompt = prompts.createPersonProfileMessage(
                    messageForCorrection,
                    customerSegment,
                    hypothesesPersonProfile,
                    wantToChangeInfo
                );

                const aiResponse = await chatGPTService.createAnswerWithThread(
                    project.assistantId,
                    hypothesesCore.threadId,
                    prompt
                );

                const newPersonProfile = {
                    ...hypothesesPersonProfile.toObject(),
                    ...aiResponse.response,
                    id: hypothesesPersonProfile._id.toString(),
                };
                await hypothesesPersonProfileService.changeHypothesesPersonProfile(
                    newPersonProfile,
                    userId
                );
            }
        } catch (error) {
            elevateError(error);
        }
    }


}

const migrationService = new MigrationService();
export default migrationService;
