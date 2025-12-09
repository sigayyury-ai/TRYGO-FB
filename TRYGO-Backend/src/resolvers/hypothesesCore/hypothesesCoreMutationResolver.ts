import { elevateError } from '../../errors/elevateError';
import {
    ChangeHypothesesCoreInput,
    ProjectHypothesisIdPromptPartInput,
} from '../../generated/graphql';
import { IContext } from '../../types/IContext';
import hypothesesCoreService from '../../services/HypothesesCoreService';
import { createCorePart } from '../../utils/hypothesis/createCorePart';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import projectService from '../../services/ProjectService';

const hypothesesCoreMutationResolvers = {
    Mutation: {
        async changeHypothesesCore(
            _: unknown,
            { input }: { input: ChangeHypothesesCoreInput },
            context: IContext
        ) {
            try {
                return await hypothesesCoreService.changeHypothesesCore(
                    input,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },

        async regenerateHypothesesCore(
            _: unknown,
            { input }: { input: ProjectHypothesisIdPromptPartInput },
            context: IContext
        ) {
            try {
                const projectHypothesis =
                    await projectHypothesesService.getProjectHypothesisByIdWithCheck(
                        input.projectHypothesisId,
                        context.userId
                    );

                const project = await projectService.getProjectById(
                    projectHypothesis.projectId.toString(),
                    context.userId
                );

                await hypothesesCoreService.deleteHypothesesCore(
                    input.projectHypothesisId,
                    context.userId
                );

                await createCorePart({
                    projectHypothesis,
                    assistantId: project.assistantId,
                    userId: context.userId,
                    promptPart: input.promptPart,
                });

                return await hypothesesCoreService.getHypothesesCore(
                    input.projectHypothesisId,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },
    },
};

export default hypothesesCoreMutationResolvers;
