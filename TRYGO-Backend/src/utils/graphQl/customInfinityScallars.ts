import { GraphQLScalarType, Kind } from 'graphql';

export const InfinityOrNumberType = new GraphQLScalarType({
    name: 'InfinityOrNumber',
    description: 'Represent number or infinity',
    serialize(value) {
        if (value === Infinity) return 'Infinity';
        if (typeof value === 'number' && !isNaN(value)) return value;
        throw new Error('The value should be a number or infinity');
    },
    parseValue(value) {
        if (value === 'Infinity') return Infinity;
        if (typeof value === 'number' && !isNaN(value)) return value;
        throw new Error('The value should be a number or infinity');
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING && ast.value === 'Infinity') {
            return 'Infinity';
        }
        if (ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
            return parseFloat(ast.value);
        }
        throw new Error('The value should be a number or infinity');
    },
});
