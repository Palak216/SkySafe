module.exports = {
  testEnvironment: "node",
  testTimeout: 30000,
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
