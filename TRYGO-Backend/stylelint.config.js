const { propertyGroups } = require('stylelint-config-clean-order');

const propertiesOrder = propertyGroups.map((properties) => ({
    noEmptyLineBetween: true,
    emptyLineBefore: 'never',
    properties,
}));

if (propertiesOrder.length >= 8) {
    const temp = propertiesOrder[6];

    propertiesOrder[6] = propertiesOrder[7];
    propertiesOrder[7] = temp;
}

module.exports = {
    extends: ['stylelint-config-clean-order'],
    plugins: ['stylelint-order', 'stylelint-prettier'],
    rules: {
        'prettier/prettier': true,
        'block-no-empty': true,
        'declaration-block-no-duplicate-properties': true,
        'custom-property-pattern': null,
        'selector-class-pattern': null,
        'declaration-empty-line-before': null,
        'no-descending-specificity': null,
        'media-feature-range-notation': null,
        'number-max-precision': null,
        'order/properties-order': [
            propertiesOrder,
            {
                severity: 'warn',
                unspecified: 'bottomAlphabetical',
            },
        ],
    },
};
