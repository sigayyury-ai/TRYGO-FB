import * as Sentry from '@sentry/node';
import { GraphQLFormattedError } from 'graphql/error';
import { generateTagsForGraphQLError } from '../utils/graphQl/generateTagsForGraphQLError';
import { GraphQlErrorTags } from '../types/sentryTypes';

class SentryErrHandler {
    public static logError(error: Error, tags?: GraphQlErrorTags): void {
        Sentry.withScope((scope) => {
            if (tags) {
                scope.setTag('method', tags.method);
                scope.setTag('file', tags.file);
            }

            Sentry.captureException(error);
        });
    }

    public static formatGraphQLError(
        error: GraphQLFormattedError
    ): GraphQLFormattedError {
        const tags = generateTagsForGraphQLError(error);
        this.logError(new Error(error.message), tags);

        return {
            message: error.message,
            locations: error.locations,
            path: error.path,
            // extensions: error.extensions,
        };
    }
}

export default SentryErrHandler;
