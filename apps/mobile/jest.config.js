module.exports = {
  preset: "react-native",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  transformIgnorePatterns: ["node_modules/(?!(react-native|@react-native|@testing-library)/)"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/**/index.ts"]
};
