export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@assets/(.*)$': '<rootDir>/attached_assets/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/client/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/client/src/**/?(*.)(spec|test).(ts|tsx|js)',
    '<rootDir>/server/**/__tests__/**/*.(ts|js)',
    '<rootDir>/server/**/?(*.)(spec|test).(ts|js)',
  ],
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    'server/**/*.{ts,js}',
    '!client/src/**/*.d.ts',
    '!server/**/*.d.ts',
    '!client/src/main.tsx',
    '!server/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
};
