module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier',
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'react', 'react-native', 'react-hooks'],
    env: {
        'react-native/react-native': true,
    },
    rules: {
        'react/react-in-jsx-scope': 'off', // Not needed in modern React/Expo
        '@typescript-eslint/no-explicit-any': 'warn',
        'react-native/no-unused-styles': 'warn',
        'react-native/no-inline-styles': 'warn',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
};
