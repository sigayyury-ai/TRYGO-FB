import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import hypothesesValidationService from '../../services/HypothesesValidationService';
import { createValidationPart } from '../../utils/hypothesis/createValidationPart';

const hypothesesValidationQueryResolver = {
    Query: {
        async getHypothesesValidation(
            _: never,
            { projectHypothesisId }: { projectHypothesisId: string },
            context: IContext
        ) {
            try {
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

                const hypothesesValidation =
                    await hypothesesValidationService.getHypothesesValidation(
                        projectHypothesisId,
                        context.userId
                    );
                
                // Просто возвращаем то, что есть (или null, если нет валидации)
                // Не генерируем автоматически - пользователь должен нажать кнопку
                return hypothesesValidation;
            } catch (err) {
                throw elevateError(err);
            }
        },
    },
};

export default hypothesesValidationQueryResolver;
