// Jest setup file for React Native testing
/* global jest */

// Extend Jest matchers
import "@testing-library/jest-native/extend-expect";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve())
}));

// Mock Supabase
jest.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: { id: "test-user-id" } },
          error: null
        })
      )
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: {}, error: null }))
    })),
    rpc: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    functions: {
      invoke: jest.fn(() => Promise.resolve({ data: {}, error: null }))
    }
  }
}));

// Mock Expo Router
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn()
  })),
  useFocusEffect: jest.fn((callback) => {
    // Call the callback immediately in tests
    if (typeof callback === "function") {
      callback();
    }
  })
}));

// Mock Expo Local Authentication
jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true, error: null }))
}));

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};
