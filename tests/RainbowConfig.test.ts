import test from 'ava';
import path from 'path';

import RainbowConfig from '../index.js';

test('Instantiate RainbowConfig', async(t) => {
    const config = new RainbowConfig(undefined);
    t.truthy(config);
});


test('Load config file with a correct config file path', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('development');
    await config.load(rootDir);
    t.is(config.getEnvironment(), 'development');
});


test('Load config file with an invalid config file path', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'nope');
    const config = new RainbowConfig('development');
    await t.throwsAsync(async() => {
        await config.load(rootDir);
    });
});

test('Load config in an environment without config file', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('prod');
    await t.throwsAsync(async() => {
        await config.load(rootDir);
    });
});

test('Load config file and get a configuration value', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('dev');
    await config.load(rootDir);
    t.is(config.get('db.main.port'), 5432);
});

test('Load config file and get a configuration value loaded from the secrets file', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('dev');
    await config.load(rootDir);
    t.is(config.get('db.main.password'), 'secure');
});

test('Load config file and get an inexistent configuration value', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('dev');
    await config.load(rootDir);
    t.throws(() => {
        config.get('db.main.nope');
    });
});

test('Load config file and get an optional existing value', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('dev');
    await config.load(rootDir);
    t.is(config.getOptional('db.main.port'), 5432);
});

test('Load config file and get an optional missing value', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('dev');
    await config.load(rootDir);
    t.is(config.getOptional('db.main.nope'), undefined);
});

test('get<T>() and getOptional<T>() support typed assignments', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('dev');
    await config.load(rootDir);

    const port: number = config.get<number>('db.main.port');
    const missing: string | undefined = config.getOptional<string>('db.main.nope');

    t.is(port, 5432);
    t.is(missing, undefined);
});

test('Load config file and get required primitive values', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('dev');
    await config.load(rootDir);

    t.is(config.getString('db.main.password'), 'secure');
    t.is(config.getNumber('db.main.port'), 5432);
    t.is(config.getBoolean('test'), true);
});

test('Required primitive getters throw when key is missing', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('dev');
    await config.load(rootDir);

    t.throws(() => {
        config.getString('db.main.nope');
    });
    t.throws(() => {
        config.getNumber('db.main.nope');
    });
    t.throws(() => {
        config.getBoolean('db.main.nope');
    });
});

test('Required primitive getters throw when type is wrong', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('dev');
    await config.load(rootDir);

    t.throws(() => {
        config.getString('db.main.port');
    });
    t.throws(() => {
        config.getNumber('db.main.password');
    });
    t.throws(() => {
        config.getBoolean('db.main.port');
    });
});

test('Load config file and get optional primitive values', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('dev');
    await config.load(rootDir);

    t.is(config.getOptionalString('db.main.password'), 'secure');
    t.is(config.getOptionalNumber('db.main.port'), 5432);
    t.is(config.getOptionalBoolean('test'), true);
});

test('Optional primitive getters return undefined when key is missing', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('dev');
    await config.load(rootDir);

    t.is(config.getOptionalString('db.main.nope'), undefined);
    t.is(config.getOptionalNumber('db.main.nope'), undefined);
    t.is(config.getOptionalBoolean('db.main.nope'), undefined);
});

test('Optional primitive getters throw when type is wrong', async(t) => {
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    const config = new RainbowConfig('dev');
    await config.load(rootDir);

    t.throws(() => {
        config.getOptionalString('db.main.port');
    });
    t.throws(() => {
        config.getOptionalNumber('db.main.password');
    });
    t.throws(() => {
        config.getOptionalBoolean('db.main.port');
    });
});