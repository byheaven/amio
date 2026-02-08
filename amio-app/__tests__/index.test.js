import TestUtils from '@tarojs/test-utils-react'

describe('Testing', () => {

  test('Test', async () => {
    const testUtils = new TestUtils()
    await testUtils.createApp()
    expect(testUtils.html()).toMatchSnapshot()
  })

})
