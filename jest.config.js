import { defaults } from 'jest-config';

export default {
    ...defaults,
    testEnvironment: 'jest-environment-jsdom-sixteen',
    transform: {},
    roots: ['dist/tests'],
    moduleFileExtensions: ['js'],
    automock: false,
    coverageProvider: 'v8',
};