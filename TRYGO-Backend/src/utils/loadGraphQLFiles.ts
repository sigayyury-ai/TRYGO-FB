import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';

const graphqlFilesPath = './src/typeDefs';

export function loadGraphQLFiles() {
    const loadedFiles = loadFilesSync(`${graphqlFilesPath}/**/*.graphql`);
    return mergeTypeDefs(loadedFiles);
}
