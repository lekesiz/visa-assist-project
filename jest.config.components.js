const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest for component testing
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.components.ts'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/e2e/', '__tests__/api/'],
  testMatch: [
    '**/tests/components/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/components/**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/components/**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/lib/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/lib/utils/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/config/(.*)$': '<rootDir>/config/$1',
    '^@/services/(.*)$': '<rootDir>/lib/services/$1',
    '^@/features/(.*)$': '<rootDir>/components/features/$1',
    '^@/ui/(.*)$': '<rootDir>/components/ui/$1',
    
    // Mock CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    
    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/tests/setup/__mocks__/styleMock.js',
    
    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/tests/setup/__mocks__/fileMock.js',

    // Mock Next.js specific modules
    'next/router': '<rootDir>/tests/setup/__mocks__/next-router.js',
    'next/link': '<rootDir>/tests/setup/__mocks__/next-link.js',
    'next/image': '<rootDir>/tests/setup/__mocks__/next-image.js',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    '!components/**/*.stories.{js,jsx,ts,tsx}',
    '!components/**/index.{js,jsx,ts,tsx}',
    '!components/**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/tests/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@radix-ui|lucide-react))',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);