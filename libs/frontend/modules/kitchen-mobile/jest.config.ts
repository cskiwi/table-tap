/* eslint-disable */
export default {
  displayName: 'frontend-modules-kitchen-mobile',
  preset: '../../../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../../../coverage/libs/frontend/modules/kitchen-mobile',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.stories.ts',
    '!src/test-setup.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts',
  ],
  coverageReporters: ['html', 'text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}