import { GraphQLFormattedError } from 'graphql/error';
import { getStackErrFileName } from './getStackErrFileName';
import { GraphQlErrorTags } from '../../types/sentryTypes';

export const generateTagsForGraphQLError = (
    err: GraphQLFormattedError
): GraphQlErrorTags => {
    const filename = getStackErrFileName(err);

    return <GraphQlErrorTags>{
        method: err.path ? err.path[0] : 'unknown',
        file: filename,
    };
};
