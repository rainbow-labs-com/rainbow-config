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