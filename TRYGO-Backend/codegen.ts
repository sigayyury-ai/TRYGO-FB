import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    overwrite: true,
    schema: './src/typeDefs/**/*.graphql',
    generates: {
        'src/generated/graphql.ts': {
            plugins: ['typescript', 'typescript-resolvers'],
            config: {
                skipTypename: true,
            },
        },
    },
};

export default config;
