export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  moduleDirectories: ['node_modules', 'src', 'game'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/game/(.*)$': '<rootDir>/game/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};