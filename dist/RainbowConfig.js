import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
const { promises: { readFile } } = fs;
export default class RainbowConfig {
    constructor() {
        this.secrets = new Map();
        this.environments = new Set([
            'development',
            'testing',
            'integration',
            'production',
        ]);
        this.isLoaded = false;
        this.secretsFileLoaded = false;
        this.configDir = 'config';
    }
    /**
     * change the directory the config files are stored in
     *
     * @param configDir the directory the configfiles are stored in
     */
    setConfigDir(configDir) {
        if (this.isLoaded) {
            throw new Error(`Cannot set the config dir after the configuration was loaded!`);
        }
        this.configDir = configDir;
    }
    /**
     * Add an environment to your application
     *
     * @param name environment name
     */
    addEnvironment(name) {
        if (this.isLoaded) {
            throw new Error(`Cannot add an environment after the configuration was loaded!`);
        }
        this.environments.add(name);
    }
    /**
     * Returns the execution environment name
     *
     * @returns the environment the application is executed in
     */
    getEnvironment() {
        if (!this.isLoaded) {
            throw new Error(`Cannot return the environment. Please call the load() method on the RainbowConfig first!`);
        }
        return this.env;
    }
    /**
     * Load a value from the config file
     *
     * @param key the config key to get. Can be a path separated by .
     * @returns the config item
     */
    get(key) {
        if (!this.isLoaded) {
            throw new Error(`Cannot return config value for key ${key}. Please call the load() method on the RainbowConfig first!`);
        }
        if (typeof key === 'undefined') {
            return this.config;
        }
        else {
            return this.getValueByPath(this.config, key.split('.'));
        }
    }
    /**
     * Get config values from the ensted config object
     *
     * @param tree current config tree
     * @param pathParts parts of the path to retreive
     * @param index the current index in the path
     * @returns the config item
     */
    getValueByPath(tree, pathParts, index = 0) {
        if (pathParts.length < index || !pathParts[index].length) {
            throw new Error(`Cannot return config value for key: ${pathParts.join('.')}: Index out of range or empty key!`);
        }
        const currentKey = pathParts[0];
        if (tree[currentKey]) {
            if (index === pathParts.length - 1) {
                return tree[currentKey];
            }
            else {
                return this.getValueByPath(tree[currentKey], pathParts, index + 1);
            }
        }
        else {
            throw new Error(`annot return config for key ${pathParts.join('.')}: section ${pathParts[index]} does not exist!`);
        }
    }
    /**
     * Load the config file for the current environment
     *
     * @param rootPath directory where the config director is stored in
     */
    async load(rootPath) {
        this.env = this.detectEnvironmentName();
        await this.loadConfigFile(rootPath);
        this.isLoaded = true;
    }
    /**
     * Load the config file from the disk, replace secrets in it
     *
     * @param rootPath the path for the config file
     */
    async loadConfigFile(rootPath) {
        const configPath = path.resolve(rootPath, this.configDir, `${this.env}.yml`);
        try {
            this.config = await this.loadYAMLFile(configPath);
        }
        catch (err) {
            if (err instanceof Error) {
                throw new Error(`Failed to load the configuration: ${err.message}`);
            }
        }
        await this.replaceSecrets(this.config, undefined, undefined, rootPath);
    }
    /**
     * substitue values for the secrets in the config file
     *
     * @param subTree the current tree to traverse
     * @param parentKey the name of the property on the parent object
     * @param parent  the parent object
     * @param rootPath the path to the secrets file
     */
    async replaceSecrets(subTree, parentKey = '', parent = null, rootPath) {
        if (typeof subTree === 'object' && subTree !== null) {
            for (const key of Object.keys(subTree)) {
                await this.replaceSecrets(subTree[key], key, subTree, rootPath);
            }
        }
        else if (typeof subTree === 'string') {
            if (/^\$\{[a-z][a-z0-9_]*\}$/gi.test(subTree)) {
                const key = /^\$\{(?<key>[a-z][a-z0-9_]*)\}$/gi.exec(subTree).groups.name;
                parent[parentKey] = await this.getSecret(key, rootPath);
            }
        }
    }
    /**
     * Get a secret from the env or the secrets file
     *
     * @param key name of the secret
     * @param rootPath path to the secrets file
     * @returns secret
     */
    async getSecret(key, rootPath) {
        if (typeof process.env[key] === 'string') {
            return process.env[key];
        }
        return this.getSecretFromFile(key, rootPath);
    }
    /**
     * Load a value from the secrets file
     *
     * @param key the name of the secret to load
     * @param rootPath the path where the secrets file is located
     * @returns value of the secret
     */
    async getSecretFromFile(key, rootPath) {
        const configPath = path.resolve(rootPath, `secrets.${this.env}.yml`);
        if (!this.secretsFileLoaded) {
            const secrets = await this.loadYAMLFile(configPath);
            if (typeof secrets === 'object' && secrets !== null) {
                for (const [key, value] of Object.entries(secrets)) {
                    if (typeof key === 'string' && (typeof value === 'string' ||
                        typeof value === 'boolean' ||
                        typeof value === 'number')) {
                        this.secrets.set(key, value);
                    }
                    else {
                        throw new Error(`Secrets in file ${configPath} need to be  string, bool or number! Field '${key}' is typeof ${typeof value}!`);
                    }
                }
            }
            this.secretsFileLoaded = true;
        }
        if (!this.secrets.has(key)) {
            throw new Error(`Failed to load secret ${key}. It is neither provided as environment vairable nor set in the secrets file ${configPath}!`);
        }
        return this.secrets.get(key);
    }
    /**
     * Load a yaml file from th efilesystem, parse it
     *
     * @param filePath the path of the yml file to load
     * @returns the parsed yaml object
     */
    async loadYAMLFile(filePath) {
        let configString = '';
        try {
            const blob = await readFile(filePath);
            configString = blob.toString().trim();
        }
        catch (err) {
            if (err instanceof Error) {
                throw new Error(`Failed to load the file ${filePath}: ${err.message}`);
            }
        }
        if (configString.length === 0) {
            return {};
            return;
        }
        try {
            return yaml.parse(configString);
        }
        catch (err) {
            if (err instanceof Error) {
                throw new Error(`Failed to parse the file '${filePath}': ${err.message}`);
            }
        }
    }
    /**
     * Detect the environmen the application is running in
     *
     * @returns string the envornment name
     */
    detectEnvironmentName() {
        for (const param of process.argv) {
            const name = param.substring(2).toLowerCase();
            if (this.environments.has(name)) {
                return name;
            }
        }
        if (process.env.RAINBOW_ENV) {
            if (this.environments.has(process.env.RAINBOW_ENV)) {
                return process.env.RAINBOW_ENV;
            }
            throw new Error(`Unknown environment '${process.env.RAINBOW_ENV}' set using the environment variable RAINBOW_ENV!`);
        }
        if (process.env.NODE_ENV) {
            if (this.environments.has(process.env.NODE_ENV)) {
                return process.env.NODE_ENV;
            }
            throw new Error(`Unknown environment '${process.env.NODE_ENV}' set using the environment variable NODE_ENV!`);
        }
        throw new Error(`Failed to determine the environment. Please specify it using the NODE_ENV, RAINBOW_ENV environment variables or the commandline parameter --[environment]. Valid environments are: ${Array.from(this.environments.keys()).join(', ')}!`);
    }
}
//# sourceMappingURL=RainbowConfig.js.map