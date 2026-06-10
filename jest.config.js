module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/data/**/*'],
  // Ignore the gitignored Claude worktree copies (stale code + their own bundled
  // node_modules) so jest only discovers/loads THIS project's tests and avoids
  // Haste module-naming collisions from the duplicated trees.
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/'],
  moduleNameMapper: {
    // Both RC packages require native code unavailable in Jest.
    '^react-native-purchases$': '<rootDir>/__mocks__/react-native-purchases.js',
    '^react-native-purchases-ui$': '<rootDir>/__mocks__/react-native-purchases-ui.js',
  },
};
