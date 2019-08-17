import glob from '../es-modules/distributed-systems/glob/2.x/glob.js';
import parse from '../es-modules/distributed-systems/esm-yaml/1.x/parse.js';
import path from 'path';
import fs from 'fs';

const { promises: { readFile, stat } } = fs;



export default class RainbowConfig {


    constructor(configDir, secretsDir) {
        this.configDir = configDir;
        this.secretsDir = secretsDir;

        this.environments = new Set([
            'dev',
            'dev.testing',
            'testing',
            'int',
            'prod',
        ]);
    }


    /**
     * Adds an environment.
     *
     * @param      {string}  name    the env name
     */
    addEnvironment(name) {
        this.environments.add(name);
        return this;
    }



    /**
     * load the config from the file system
     */
    async load() {
        const env = this.getEnvironmentName();

        if (!env) {
            throw new Error(`Cannot load config file, no valid environment configured! Please use on of ${Array.from(this.environments).join(', ')}.`);
        }

        const configFileName = `config.${env}.yml`;
        const configFiles = new Set(await glob(this.configDir, '*.yml'));
        const configFilePath = path.join(this.configDir, configFileName);


        if (!configFiles.has(configFilePath)) {
            throw new Error(`Failed to laod config file ${configFilePath}, file does not exist!`);
        }

        const blob = await readFile(configFilePath);

        this.config = parse(blob.toString());


        if (this.secretsDir) {
            const secretsFileName = `secrets.${env}.yml`;
            const secretsFiles = new Set(await glob(this.secretsDir, '*.yml'));
            const secretsFilePath = path.join(this.secretsDir, secretsFileName);

            const stats = await stat(secretsFilePath).catch(err => null);

            if (!stats || !stats.isFile()) {
                 throw new Error(`Failed to laod secrets file ${secretsFilePath}, file does not exist!`);
            }

            const secretsBlog = await readFile(secretsFilePath);
            this.secrets = new Map(Object.entries(parse(secretsBlog.toString())));
        }


        this.replaceSecrets(this.config, null, null, []);
    }





    replaceSecrets(subTree, prentKey, parent, path) {
        if (typeof subTree === 'object') {
            for (const key of Object.keys(subTree)) {
                this.replaceSecrets(subTree[key], key, subTree, path.concat([key]));
            }
        } else if (typeof subTree === 'array') {
            let i = 0;
            for (const value of subTree) {
                i++;
                this.replaceSecrets(value, i, subTree, path.concat([i]));
            }
        } else if (typeof subTree === 'string') {
            if (/^\$\{[a-z][a-z0-9_]*\}$/gi.test(subTree)) {
                const variableName = /^\$\{(?<name>[a-z][a-z0-9_]*)\}$/gi.exec(subTree).groups.name;

                // check secrets
                if (this.secrets && this.secrets.has(variableName)) {
                    parent[prentKey] = this.secrets.get(variableName);
                    return;
                }

                // check env
                if (process.env[variableName]) {
                    parent[prentKey] = process.env[variableName];
                    return;
                }

                // args
                for (const arg of process.argv) {
                    const reg = new RegExp(`^--${variableName}=(?<value>.+)$`, 'gi');
                    const match = reg.exec(arg);

                    if (match) {
                        parent[prentKey] = match.groups.value;
                        return;
                    }
                }


                throw new Error(`Failed to resolve vraiable '${variableName}' on the config key '${path.join('.')}'!`);
            }
        }
    }






    /**
     * get the config, a value or a subtree
     *
     * @param      {string}  key     the key to search for
     * @return     {*}       config value
     */
    get(key) {
        if (!this.config) {
            throw new Error(`Cannot get config, it was not laoded!`);
        }

        if (!key) {
            return this.config;
        } else {
            return this.getByPath(key, this.config, key);
        }
    }





    /**
     * Gets the key for path.
     * 
     * @private
     *
     * @param      {string}        key                 The key
     * @param      {object|array}  [tree=this.config]  the config tree
     * @param      {string}        fullPath            The full path
     * @return     {*}             The key for path.
     */
    getByPath(key, tree, fullPath) {
        if (key.includes('.')) {
            const firstItem = key.substr(0, key.indexOf('.'));
            const item = tree[firstItem];

            if (item && (typeof item === 'object' || typeof item === 'array') && item !== null) {
                return this.getByPath(key.substr(key.indexOf('.')+1), item, fullPath);
            } else {
                throw new Error(`Canont resolve key '${firstItem}' of path '${fullPath}', key does not exist!`);
            }
        } else {
            return tree[key];
        }
    }




    /**
     * get the configured environment from the command line parameters or the
     * rainbow_env environment variable
     */
    getEnvironmentName() {
        for (const param of process.argv) {
            const name = param.substr(2).toLowerCase();

            if (this.environments.has(name)) {
                return name;
            }
        }

        if (process.env.RAINBOW_ENV) {
            if (this.environments.has(process.env.RAINBOW_ENV)){
                return process.env.RAINBOW_ENV;
            }

            throw new Error(`Unknown environment '${process.env.RAINBOW_ENV}' configured in the environment variable RAINBOW_ENV!`);
        }
    }
}