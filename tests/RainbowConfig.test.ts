import assert from 'assert';
import path from 'path';
import { defineTests, suite, test } from 'section-tests';

import RainbowConfig from '../index.js';

const getRootDir = () => path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');

export default defineTests(
    suite('RainbowConfig',
        test('Instantiate RainbowConfig', {
            async run() {
                const config = new RainbowConfig(undefined);
                assert.ok(config);
            },
        }),
        test('Load config file with a correct config file path', {
            async run() {
                const config = new RainbowConfig('development');
                await config.load(getRootDir());
                assert.strictEqual(config.getEnvironment(), 'development');
            },
        }),
        test('Load config file with an invalid config file path', {
            async run() {
                const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'nope');
                const config = new RainbowConfig('development');
                await assert.rejects(async() => {
                    await config.load(rootDir);
                });
            },
        }),
        test('Load config in an environment without config file', {
            async run() {
                const config = new RainbowConfig('prod');
                await assert.rejects(async() => {
                    await config.load(getRootDir());
                });
            },
        }),
        test('Load config file and get a configuration value', {
            async run() {
                const config = new RainbowConfig('dev');
                await config.load(getRootDir());
                assert.strictEqual(config.get<number>('db.main.port'), 5432);
            },
        }),
        test('Load config file and get a configuration value loaded from the secrets file', {
            async run() {
                const config = new RainbowConfig('dev');
                await config.load(getRootDir());
                assert.strictEqual(config.get<string>('db.main.password'), 'secure');
            },
        }),
        test('Load config file and get an inexistent configuration value', {
            async run() {
                const config = new RainbowConfig('dev');
                await config.load(getRootDir());
                assert.throws(() => {
                    config.get<unknown>('db.main.nope');
                });
            },
        }),
        test('Load config file and get an optional existing value', {
            async run() {
                const config = new RainbowConfig('dev');
                await config.load(getRootDir());
                assert.strictEqual(config.getOptional<number>('db.main.port'), 5432);
            },
        }),
        test('Load config file and get an optional missing value', {
            async run() {
                const config = new RainbowConfig('dev');
                await config.load(getRootDir());
                assert.strictEqual(config.getOptional<string>('db.main.nope'), undefined);
            },
        }),
        test('get<T>() and getOptional<T>() support typed assignments', {
            async run() {
                const config = new RainbowConfig('dev');
                await config.load(getRootDir());

                const port: number = config.get<number>('db.main.port');
                const missing: string | undefined = config.getOptional<string>('db.main.nope');

                assert.strictEqual(port, 5432);
                assert.strictEqual(missing, undefined);
            },
        }),
        test('Load config file and get required primitive values', {
            async run() {
                const config = new RainbowConfig('dev');
                await config.load(getRootDir());

                assert.strictEqual(config.getString('db.main.password'), 'secure');
                assert.strictEqual(config.getNumber('db.main.port'), 5432);
                assert.strictEqual(config.getBoolean('test'), true);
            },
        }),
        test('Required primitive getters throw when key is missing', {
            async run() {
                const config = new RainbowConfig('dev');
                await config.load(getRootDir());

                assert.throws(() => {
                    config.getString('db.main.nope');
                });
                assert.throws(() => {
                    config.getNumber('db.main.nope');
                });
                assert.throws(() => {
                    config.getBoolean('db.main.nope');
                });
            },
        }),
        test('Required primitive getters throw when type is wrong', {
            async run() {
                const config = new RainbowConfig('dev');
                await config.load(getRootDir());

                assert.throws(() => {
                    config.getString('db.main.port');
                });
                assert.throws(() => {
                    config.getNumber('db.main.password');
                });
                assert.throws(() => {
                    config.getBoolean('db.main.port');
                });
            },
        }),
        test('Load config file and get optional primitive values', {
            async run() {
                const config = new RainbowConfig('dev');
                await config.load(getRootDir());

                assert.strictEqual(config.getOptionalString('db.main.password'), 'secure');
                assert.strictEqual(config.getOptionalNumber('db.main.port'), 5432);
                assert.strictEqual(config.getOptionalBoolean('test'), true);
            },
        }),
        test('Optional primitive getters return undefined when key is missing', {
            async run() {
                const config = new RainbowConfig('dev');
                await config.load(getRootDir());

                assert.strictEqual(config.getOptionalString('db.main.nope'), undefined);
                assert.strictEqual(config.getOptionalNumber('db.main.nope'), undefined);
                assert.strictEqual(config.getOptionalBoolean('db.main.nope'), undefined);
            },
        }),
        test('Optional primitive getters throw when type is wrong', {
            async run() {
                const config = new RainbowConfig('dev');
                await config.load(getRootDir());

                assert.throws(() => {
                    config.getOptionalString('db.main.port');
                });
                assert.throws(() => {
                    config.getOptionalNumber('db.main.password');
                });
                assert.throws(() => {
                    config.getOptionalBoolean('db.main.port');
                });
            },
        }),
    )
);