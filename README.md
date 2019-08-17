# Rainbow Config

An environment aware config file loader for rainbow services

## Example config file

The DBs host and password are loaded either from a secrets file or from environment variables.

**config.yml**
```yaml
db:
    main
        port: 5432
        host: ${DB_HOST}
        password: ${MAIN_DB_PASS}
myKey: myValue
anArray
    - itemOne
    - itemTwo
```

**secrets.yml**
```yaml
DB_HOST: l.dns.porn
MAIN_DB_PASS: soSecureICantBelieveIt
```

## Environments

The config loader decides based on the environment which config file to load. The following default environments are available (you ma also define custom environments):

- dev: local development config
- dev.testing: local testing config
- int: integration 
- testing: automated testing
- prod: production

The environment can either be set by passing it as parameter to the application (e.g. `--dev`) or by defining it in the `RAINBOW_ENV` environment variable.

Based on the configured environment the config file is loaded. If the `dev` environment is active, the loader tries to load the `config.dev.yml` file.

## API

Basic config loading example

```javascrript
import RainbowConfig from '../es-modules/rainbow-industries/rainbow-config/1.x/RainbowConfig.js';
import path from 'path';

// gets the path to the dir this script resides in
const configDir = path.dirname(new URL(import.meta.url).pathname);
const secretsDir = path.join(secretsDir, '../');

// instantiate
const config = new RainbowConfig(configDir, secretsDir);

// load the config from the file system
await config.load();

// get all of the config
const allKeys = config.get();

// get some key
const someKey = config.get('myKey');
```


### Setting up the loader

```javascrript
import RainbowConfig from '../es-modules/rainbow-industries/rainbow-config/1.x/RainbowConfig.js';
import path from 'path';

// gets the path to the dir this script resides in
const configDir = path.dirname(new URL(import.meta.url).pathname);

// instantiate
const config = new RainbowConfig(configDir);

// load the config from the file system
await config.load();
```


### Getting config values

You may either consume all of the config or jsut some specific value from the config.

**get the complete config file**
```javascript
const config = config.get();
```

**get a specific root level key**
```javascript
const dbConfig = config.get('db');
```

**get a specific nested key**
```javascript
const dbHost = config.get('db.main.host');
```

### Defining custom environments

```javascript
config.addEnvironment('myEnv');
```


