import { GraphQLFormattedError } from 'graphql/error';

export const getStackErrFileName = (err: GraphQLFormattedError): string => {
    let filename = '';
    if (err.extensions?.stacktrace) {
        const stackArray = err.extensions.stacktrace as string[];
        const stackLine = stackArray.find((line) => line.includes('.ts'));
        if (stackLine) {
            const regex = /at\s+(.*?)\s+\((.*?):(\d+):\d+\)/;
            const match = regex.exec(stackLine);

            if (match) {
                const fullPath = match[2];
                filename =
                    fullPath.split('\\').pop() ||
                    fullPath.split('/').pop() ||
                    'unknown';
            }
        }
    }

    return filename;
};
