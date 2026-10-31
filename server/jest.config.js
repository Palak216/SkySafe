module.exports = {
  testEnvironment: "node",
  testTimeout: 30000,
  
  verbose: true,
  setupFiles: ["<rootDir>/tests/env.js"], 
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
