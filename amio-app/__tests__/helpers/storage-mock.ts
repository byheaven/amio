/**
 * Create a mock for Taro storage APIs
 * Returns an in-memory storage object and the mock functions
 */
export function createStorageMock() {
  const storage: Record<string, any> = {};

  const mockSetStorageSync = jest.fn((key: string, data: any) => {
    storage[key] = data;
  });

  const mockGetStorageSync = jest.fn((key: string) => {
    return storage[key];
  });

  const mockRemoveStorageSync = jest.fn((key: string) => {
    delete storage[key];
  });

  const mockClearStorageSync = jest.fn(() => {
    Object.keys(storage).forEach((key) => delete storage[key]);
  });

  return {
    storage,
    mockSetStorageSync,
    mockGetStorageSync,
    mockRemoveStorageSync,
    mockClearStorageSync,
  };
}

/**
 * Apply storage mock to Taro module
 * Usage in test file:
 *   const { storage } = mockTaroStorage();
 */
export function mockTaroStorage() {
  const mocks = createStorageMock();

  jest.mock('@tarojs/taro', () => ({
    setStorageSync: mocks.mockSetStorageSync,
    getStorageSync: mocks.mockGetStorageSync,
    removeStorageSync: mocks.mockRemoveStorageSync,
    clearStorageSync: mocks.mockClearStorageSync,
  }));

  return mocks;
}
