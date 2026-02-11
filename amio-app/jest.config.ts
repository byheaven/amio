const defineJestConfig = require('@tarojs/test-utils-react/dist/jest.js').default

module.exports = defineJestConfig({
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/__tests__/**/*.(spec|test).[jt]s?(x)',
    '<rootDir>/__tests__/**/*.steps.[jt]s?(x)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|scss)$': '<rootDir>/__tests__/helpers/style-mock.js',
  },
})
