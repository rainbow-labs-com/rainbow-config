export default class RainbowConfig {
    private config;
    private secrets;
    private readonly environments;
    private env;
    private isLoaded;
    private secretsFileLoaded;
    private configDir;
    /**
     * change the directory the config files are stored in
     *
     * @param configDir the directory the configfiles are stored in
     */
    setConfigDir(configDir: string): void;
    /**
     * Add an environment to your application
     *
     * @param name environment name
     */
    addEnvironment(name: string): void;
    /**
     * Returns the execution environment name
     *
     * @returns the environment the application is executed in
     */
    getEnvironment(): string;
    /**
     * Load a value from the config file
     *
     * @param key the config key to get. Can be a path separated by .
     * @returns the config item
     */
    get(key: string | undefined): any;
    /**
     * Get config values from the ensted config object
     *
     * @param tree current config tree
     * @param pathParts parts of the path to retreive
     * @param index the current index in the path
     * @returns the config item
     */
    private getValueByPath;
    /**
     * Load the config file for the current environment
     *
     * @param rootPath directory where the config director is stored in
     */
    load(rootPath: string): Promise<void>;
    /**
     * Load the config file from the disk, replace secrets in it
     *
     * @param rootPath the path for the config file
     */
    private loadConfigFile;
    /**
     * substitue values for the secrets in the config file
     *
     * @param subTree the current tree to traverse
     * @param parentKey the name of the property on the parent object
     * @param parent  the parent object
     * @param rootPath the path to the secrets file
     */
    private replaceSecrets;
    /**
     * Get a secret from the env or the secrets file
     *
     * @param key name of the secret
     * @param rootPath path to the secrets file
     * @returns secret
     */
    private getSecret;
    /**
     * Load a value from the secrets file
     *
     * @param key the name of the secret to load
     * @param rootPath the path where the secrets file is located
     * @returns value of the secret
     */
    private getSecretFromFile;
    /**
     * Load a yaml file from th efilesystem, parse it
     *
     * @param filePath the path of the yml file to load
     * @returns the parsed yaml object
     */
    private loadYAMLFile;
    /**
     * Detect the environmen the application is running in
     *
     * @returns string the envornment name
     */
    private detectEnvironmentName;
}
