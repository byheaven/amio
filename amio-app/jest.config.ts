const defineJestConfig = require('@tarojs/test-utils-react/dist/jest.js').default

module.exports = defineJestConfig({
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/__tests__/**/*.(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^@tarojs/router$': '<rootDir>/__tests__/__mocks__/tarojsRouter.ts',
    '^.+\\.(css|scss|sass|less)$': '<rootDir>/__tests__/__mocks__/styleMock.ts',
  },
})
