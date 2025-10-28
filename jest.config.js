module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    globals: {
        "ts-jest": {
            tsConfig: "<rootDir>/jest.tsconfig.json",
        },
    },
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.test.ts',
        '!src/**/*.d.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: 'test-results',
            outputName: 'jest-junit.xml',
        }]
    ],
    projects: [
        {
            displayName: "test",
            transform: {
                ".(ts|js)": "ts-jest",
            },
            testMatch: ['**/__tests__/**/*.(test|spec).ts'],
            moduleDirectories: ["<rootDir>/src/", "<rootDir>/node_modules"],
            moduleFileExtensions: ["ts", "js"],
            transformIgnorePatterns: [
                "node_modules/(?!(until-async|msw)/)"
            ],
            resetMocks: true,
        },
    ],
};

