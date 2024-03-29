# Rainbow Config

YAML config files made simple for TypeScript and JavaScript using ESM.

## Changelog

***Version 3.x*** 
- The path is now passed to the `load()` method instead of the constructor
- The `load()` method has now one argument: the path
- The library was re-implemented using TypeScript and exports types
- The library can still be used using JavaScript


## Example config file

The DBs host and password are loaded either from a secrets file or from environment variables.

**config/development.yml**
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

**secrets.development.yml**
```yaml
DB_HOST: l.dns.porn
MAIN_DB_PASS: soSecureICantBelieveIt
```

## Environments

The config loader decides based on the environment which config file to load. The following default environments are available (alternative names):

- development (dev)
- testing (test)
- integration (int)
- production (prod)

The environment can either be set by passing it as parameter to the application (e.g. `--develpment`) or by defining it in the `RAINBOW_ENV` or `NODE_ENV` environment variable.

Based on the configured environment the config file is loaded. If the `development` environment is active, the loader tries to load the `config/development.yml` file.

## Example

It is based on the example config above.

```typescript
import RainbowConfig from '@rainbow-config/RainbowConfig';
import { URL } from 'url';
import path from 'path';

const config = new RainbowConfig();

// you may add custom environments
config.addEnvironment('extra-env');

// you may load the config from a custom directory, default is config
config.setConfigDir('conf');

// get the directory where the config filder is located in
const rootdir = path.join(path.dirname(new URL(import.meta.url).pathname, '../');

// load the config file (the secrets dir parameter is optional)
await config.load(rootdir, secretsDir);

// get the full config object
const allKeys = config.get();

// get the db password
const dbPassword = config.get('db.main.password');

// prints: soSecureICantBelieveIt
console.log(dbPassword);
```

## API

### Constructor: instantiate the config class

The constructor accepts optionaly the environment name asparameter 1

```typescript
const config = new RainbowConfig();
```


### Add an environment: config.addEnvironment(name: string)

You may optionally add an environment. You may also specify an alternative name that maps
to the environment name i.e. int for integration.

The follwoing envormnents are available (alternative names):

- development (dev)
- testing (test)
- integration (int)
- production (prod)

```typescript
config.addEnvironment('extra-env', 'alternative-name-for-extra-env');
```


### Change the config directory: config.setConfigDir(relativePath: string)

You may change the directory the config files are located in. This defaults to `config`.


```typescript
config.setConfigDir('conf');
```


### Load the confguration: config.load(rootDir: string, secretsDir?: string)

In order to load the config, you have to call the `load` method. This will load the config from the `${rootPath}/config` directory.
This will load the config file an fill all variables that are either set in the environment or the secrets file. If a variable is not
found in an env variable, it is assumed, that it shall be loaded from the secrets file, which is located in the `rootPath` passed to the
`load(rootPath: string)` method. The secrets file has the name `secrets.${environment}.yaml`. If the secretsDir is passed to the load method, 
that directory will be used to load the secrets.


```typescript
const rootdir = path.join(path.dirname(new URL(import.meta.url).pathname, '../');
await config.load(rootdir);
```


### Get a config value: config.get(path: string | undefined)

Get the complete config object.

```typescript
const configData = config.get(undefined);
```


Get the a partial config object

```typescript
const configData = config.get(`db.main`);
```


Get the a specific key

```typescript
const configData = config.get(`db.main.password`);
```