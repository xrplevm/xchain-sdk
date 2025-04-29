module.exports = {
    testEnvironment: "jsdom",
    moduleFileExtensions: ["js", "ts"],
    rootDir: ".",
    testRegex: ".*\\.(test|spec)\\.ts$",
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    collectCoverageFrom: ["./src/**/*.ts"],
    coverageThreshold: {
        global: {
            branches: 0,
            statements: 0,
        },
    },
};
