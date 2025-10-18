const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.api.ts'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/api/**/*.test.ts'],
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/$1',
    // Mock Supabase modules
    '@supabase/ssr': '<rootDir>/tests/setup/__mocks__/@supabase/ssr.js',
    '@supabase/supabase-js': '<rootDir>/tests/setup/__mocks__/@supabase/supabase-js.js',
    // Mock AI SDK modules
    '@anthropic-ai/sdk': '<rootDir>/tests/setup/__mocks__/@anthropic-ai/sdk.js',
    'openai': '<rootDir>/tests/setup/__mocks__/openai.js',
  },
  collectCoverageFrom: [
    'app/api/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);