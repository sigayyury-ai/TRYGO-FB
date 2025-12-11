import { elevateError } from '../../errors/elevateError';
import { ChangeProjectAssistantInput } from '../../generated/graphql';
import { IContext } from '../../types/IContext';
import projectAssistantService from '../../services/ProjectAssistantService';

const projectAssistantMutationResolver = {
    Mutation: {
        async changeProjectAssistant(
            _: unknown,
            { input }: { input: ChangeProjectAssistantInput },
            context: IContext
        ) {
            try {
                await projectAssistantService.changeProjectAssistant(
                    input,
                    context.userId
                );

                return 'Assistant changed successfully';
            } catch (error) {
                throw elevateError(error);
            }
        },
    },
};

export default projectAssistantMutationResolver;
