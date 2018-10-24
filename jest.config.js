module.exports = {
  testURL: 'http://localhost/',

  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/test/.*\\.test)\\.tsx?$',
  modulePathIgnorePatterns: ['/build/'],

  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: true,
};
