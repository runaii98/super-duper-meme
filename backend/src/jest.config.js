module.exports = {
  testEnvironment: 'node',
  testTimeout: 10000,
  // Only collect coverage for our specific files
  collectCoverageFrom: [
    'services/aws_service.js',
    'services/gcp_service.js',
    'routes/cloud_provider_routes.js'
  ],
  // Use default automock settings
  automock: false,
  // Clear mocks for all tests
  clearMocks: true,
  // Collect coverage
  collectCoverage: false,
  // Where to output coverage files
  coverageDirectory: 'coverage',
  // Test file pattern matching - only run our specific test files
  testMatch: [
    '**/services/aws_service.test.js',
    '**/services/gcp_service.test.js',
    '**/routes/cloud_provider_routes.test.js'
  ],
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  // Skip transforming node_modules
  transformIgnorePatterns: [
    '/node_modules/'
  ]
}; 