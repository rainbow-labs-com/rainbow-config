import section from '../es-modules/distributed-systems/section-tests/1.x/index.js';
import RainbowConfig from '../RainbowConfig.js';
import path from 'path';
import assert from 'assert';


process.argv.push('--dev');
process.argv.push('--db_host=l.dns.porn');
process.env.DB_PASSWORD = 'so secure';


const configDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'data');


section('RainbowConfig', (section) => {
    section.test('load config', async () => {
        const config = new RainbowConfig(configDir, configDir);
        await config.load();

        const data = config.get();

        assert(data);
        assert.equal(data.test, true);
    });


    section.test('load config by key', async () => {
        const config = new RainbowConfig(configDir, configDir);
        await config.load();

        const data = config.get('test');
        assert.equal(data, true);
    });


    section.test('load config by nested key', async () => {
        const config = new RainbowConfig(configDir, configDir);
        await config.load();

        const data = config.get('db.main.port');
        assert.equal(data, 5432);
    });


    section.test('load config by nested key [array]', async () => {
        const config = new RainbowConfig(configDir, configDir);
        await config.load();

        const data = config.get('anArray.1');
        assert.equal(data, 'itemTwo');
    });


    section.test('load secrets file', async () => {
        const config = new RainbowConfig(configDir, configDir);
        await config.load();
    });


    section.test('get value from secrets file', async () => {
        const config = new RainbowConfig(configDir, configDir);
        await config.load();

        const data = config.get('db.main.user');
        assert.equal(data, 'Lina Marieke');
    });
});