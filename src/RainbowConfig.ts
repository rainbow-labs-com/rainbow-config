import path from 'path';
import fs from 'fs';
import yaml from 'yaml';

const { promises: { readFile } } = fs;

export interface ISomeRetunrType {
    name: string;
    value: string;
}

/**
 * YAML config file loader
 * 
 * @public
 */
export default class RainbowConfig {

    private config: any;
    private secrets: Map<string, string | number | boolean> = new Map();
    private readonly environments: Set<string> = new Set([
        'development',
        'testing',
        'integration',
        'production',
    ]);

    private readonly environmentMap : Map<string, string> = new Map([
        ['dev', 'development'],
        ['test', 'testing'],
        ['int', 'integration'],
        ['prod', 'production']
    ]);

    private env: string;
    private isLoaded: boolean = false;
    private secretsFileLoaded: boolean = false;
    private configDir: string = 'config';



    /**
     * @param env - the environment to use for loading the config file
     */
    constructor(env? : string) {
        if (typeof env === 'string') {
            this.env = env;
        }
    }


    /**
     * change the directory the config files are stored in
     * 
     * @param configDir - the directory the configfiles are stored in
     */
    setConfigDir(configDir: string) : void {
        if (this.isLoaded) {
            throw new Error(`Cannot set the config dir after the configuration was loaded!`);
        }

        this.configDir = configDir;
    }


    /**
     * Add an environment to your application
     * 
     * @param name - environment name
     * @param alternativeName - alternative environment name that maps to the name i.e. int vs integration
     */
    addEnvironment(name: string, alternativeName?: string) {
        if (this.isLoaded) {
            throw new Error(`Cannot add an environment after the configuration was loaded!`);
        }

        this.environments.add(name);

        if (typeof alternativeName === 'string') {
            this.environmentMap.set(alternativeName, name);
        }
    }


    /**
     * Returns the execution environment name
     * 
     * @returns the environment the application is executed in
     */
    getEnvironment() : string {
        if (!this.isLoaded) {
            throw new Error(`Cannot return the environment. Please call the load() method on the RainbowConfig first!`);
        }

        return this.env;
    }
    

    /**
     * Load a value from the config file
     * 
     * @param key - the config key to get. Can be a path separated by .
     * @returns the config item
     */
    get(key: string | undefined) : any {
        if (!this.isLoaded) {
            throw new Error(`Cannot return config value for key ${key}. Please call the load() method on the RainbowConfig first!`);
        }

        if (typeof key === 'undefined') {
            return this.config;
        } else {
            return this.getValueByPath(this.config, key.split('.'));
        }
    }


    /**
     * Get config values from the ensted config object
     * 
     * @param tree - current config tree
     * @param pathParts - parts of the path to retreive
     * @param index - the current index in the path
     * @returns the config item
     */
    private getValueByPath(tree: any, pathParts: string[], index: number = 0) : any {
        if (pathParts.length < index || !pathParts[index].length) {
            throw new Error(`Cannot return config value for key: ${pathParts.join('.')}: Index out of range or empty key!`);
        }

        const currentKey = pathParts[index];

        if (tree[currentKey]) {
            if (index === pathParts.length - 1) {
                return tree[currentKey];
            } else {
                return this.getValueByPath(tree[currentKey], pathParts, index + 1);
            }
        } else {
            throw new Error(`Cannot return config for key ${pathParts.join('.')}: section ${pathParts[index]} does not exist!`);
        }
    }



    /**
     * Load the config file for the current environment
     * 
     * @param rootPath - directory where the config director is stored in
     */
    async load(rootPath: string, secretsDir?: string) : Promise<void> {
        this.env = this.detectEnvironmentName();
        await this.loadConfigFile(rootPath, secretsDir);
        this.isLoaded = true;
    }




    /**
     * Load the config file from the disk, replace secrets in it
     * 
     * @param rootPath - the path for the config file
     */
    private async loadConfigFile(rootPath: string, secretsDir?: string) : Promise<void> {
        const configPath = path.resolve(rootPath, this.configDir, `${this.env}.yml`);
        
        try {
            this.config = await this.loadYAMLFile(configPath);
        } catch (err) {
            if (err instanceof Error) {
                throw new Error(`Failed to load the configuration: ${err.message}`);
            }
        }

        await this.replaceSecrets(this.config, undefined, undefined, rootPath, secretsDir);
    }





    /**
     * substitue values for the secrets in the config file
     * 
     * @param subTree - the current tree to traverse
     * @param parentKey - the name of the property on the parent object
     * @param parent - the parent object
     * @param rootPath - the path to the secrets file
     */
    private async replaceSecrets(subTree: any, parentKey: string = '', parent: any = null, rootPath: string, secretsDir?: string) : Promise<void> {
        if (typeof subTree === 'object' && subTree !== null) {
            for (const key of Object.keys(subTree)) {
                await this.replaceSecrets(subTree[key], key, subTree, rootPath);
            }
        } else if (typeof subTree === 'string') {
            if (/^\$\{[a-z][a-z0-9_]*\}$/gi.test(subTree)) {
                const key = /^\$\{(?<key>[a-z][a-z0-9_]*)\}$/gi.exec(subTree)!.groups!.key;

                parent[parentKey] = await this.getSecret(key, rootPath, secretsDir);
            }
        }
    }




    /**
     * Get a secret from the env or the secrets file
     * 
     * @param key - name of the secret
     * @param rootPath - path to the secrets file
     * @returns secret
     */
    private async getSecret(key: string, rootPath: string, secretsDir?: string): Promise<string | boolean | number> {
        if (typeof process.env[key] === 'string') {
            return process.env[key]!;
        }

        return this.getSecretFromFile(key, rootPath);
    }



    /**
     * Load a value from the secrets file
     * 
     * @param key - the name of the secret to load
     * @param rootPath - the path where the secrets file is located
     * @returns value of the secret
     */
    private async getSecretFromFile(key: string, rootPath: string, secretsDir?: string): Promise<string | boolean | number> {
        const configPath = path.resolve(typeof secretsDir === 'string' ? secretsDir : rootPath, `secrets.${this.env}.yml`);


        if (!this.secretsFileLoaded) {
            const secrets: any = await this.loadYAMLFile(configPath);

            if (typeof secrets === 'object' && secrets !== null) {
                for (const [key, value] of Object.entries(secrets)) {
                    if (typeof key === 'string' && (
                        typeof value === 'string' ||
                        typeof value === 'boolean' ||
                        typeof value === 'number')
                    ) {
                        this.secrets.set(key, value);
                    } else {
                        throw new Error(`Secrets in file ${configPath} need to be a string, bool or number! Field '${key}' is typeof ${typeof value}!`);
                    }
                }
            }

            this.secretsFileLoaded = true;
        }

        if (!this.secrets.has(key)) {
            throw new Error(`Failed to load secret ${key}. It is neither provided as environment variable nor set in the secrets file ${configPath}!`);
        }

        return this.secrets.get(key)!;
    }



    /**
     * Load a yaml file from th efilesystem, parse it
     * 
     * @param filePath - the path of the yml file to load
     * @returns the parsed yaml object
     */
    private async loadYAMLFile(filePath: string) : Promise<any> {
        let configString: string = '';

        try {
            const blob = await readFile(filePath);
            configString = blob.toString().trim();
        } catch(err) {
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
        } catch (err) {
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
    private detectEnvironmentName(): string {
        if (this.env !== undefined) {
            const env = this.getTranslatedEnvironment(this.env);
            this.validateEnvironment(env);
            return env;
        }

        for (const param of process.argv) {
            const name = this.getTranslatedEnvironment(param.substring(2).toLowerCase());

            if (this.environments.has(name)) {
                return name;
            }
        }

        if (process.env.RAINBOW_ENV) {
            const env = this.getTranslatedEnvironment(process.env.RAINBOW_ENV);
            if (this.environments.has(env)) {
                return env;
            }

            throw new Error(`Unknown environment '${process.env.RAINBOW_ENV}' set using the environment variable RAINBOW_ENV!`);
        }

        if (process.env.NODE_ENV) {
            const env = this.getTranslatedEnvironment(process.env.NODE_ENV);

            if (this.environments.has(env)){
                return env;
            }

            throw new Error(`Unknown environment '${process.env.NODE_ENV}' set using the environment variable NODE_ENV!`);
        }

        throw new Error(`Failed to determine the environment. Please specify it using the NODE_ENV, RAINBOW_ENV environment variables or the commandline parameter --[environment]. Valid environments are: ${Array.from(this.environments.keys()).join(', ')}!`);
    }



    /**
     * checks if there is an alternative name for a given environment name, translates it if yes
     * 
     * @param env - the name of the enviroment to translate
     * @returns the translated or original environment if no translation was found
     */
    getTranslatedEnvironment(env : string) : string {
        if (this.environmentMap.has(env)) {
            return this.environmentMap.get(env)!;
        } 

        return env;
    }


    /**
     * determines if the given environment is registered and thus valid
     * 
     * @param env - the environment name
     */
    private validateEnvironment(env: string) {
        if (!this.environments.has(env)) {
            throw new Error(`The environment ${env} is not a valid environment!`);
        }
    }
}