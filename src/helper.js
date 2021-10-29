const { promisify } = require('util');
const { execSync, exec } = require('child_process');
const execPromiseModule = promisify(exec);

const SHORT_COMMAND_MAPPING = {
    a: 'apply',
    c: 'console',
    d: 'destroy',
    e: 'env',
    f: 'fmt',
    i: 'import',
    o: 'output',
    p: 'plan',
    r: 'refresh',
    s: 'show',
    t: 'taint',
    u: 'untaint',
    v: 'validate',
    w: 'workspace',
};

const SHORT_ARGUMENT_MAPPING = {
    auto: 'auto-approve',
    a: 'auto-approve',
};

const LOG_LEVELS = [
    'trace',
    'debug',
    'info',
    'warn',
    'error',
];

const terraformAppName = 'terraform';

const helper = {
    checkTerraformApp: async () => {
        try {
            await helper.execPromise([
                terraformAppName,
                '-v'
            ]);
            return true;
        } catch (err) {
            return false;
        }
    },
    /**
     * `execModule` works similar to `execPromise`,
     * but without being asynchronous and return value
     *
     * @param {Array|String} commands
     * @param {Boolean=} silenzio
     * @returns (Undefined)
     */
    execModule: (commands, silenzio = true) => {
        if (Object.prototype.toString.call(commands) === '[object Array]') {
            commands = commands
                .filter(item => typeof item !== 'undefined')
                .join(' ');
        } else if (typeof commands === 'string') {
            if (!commands.length) {
                throw Error(`execModule: '${JSON.stringify(commands)}' (${typeof commands}) is empty!`);
            }
            commands = commands.trim();
        } else {
            throw Error(`execModule: '${JSON.stringify(commands)}' (${typeof commands}) not supported!`);
        }
        try {
            execSync(
                commands,
                {
                    stdio: 'inherit',
                    maxBuffer: (1024 * 4096)
                }
            );
        } catch (err) {
            if (!silenzio) {
                throw Error(err);
            }
        }
    },
    /**
     * `buildCommandList` builds an Array containing the terraform command and arguments.
     *
     * @param {Array} argList
     * @param {Array} cmdList
     * @returns {Array}
     */
    buildCommandList: (argList, cmdList) => {

        let commandList = [
            terraformAppName,
            ...cmdList,
        ];

        if (argList.length) {
            const logLevel = Object
                .keys(argList)
                .find((key) =>
                    LOG_LEVELS.includes(key));

            if (typeof logLevel !== 'undefined') {
                commandList = [...[ 'export', `TF_LOG="${logLevel}" &&` ], ...commandList];
            }
        }

        return [...commandList, ...argList.reduce((args, { key, value }) => {

            if (![...LOG_LEVELS, ...[
                'watch',
            ]].includes(key)) {

                let argString = `-${key}`;
                if (typeof value !== 'undefined') {
                    argString += `=${value}`;
                }

                args.push(argString);
            }

            return args;
        }, [])];
    },
    /**
     * `execPromise` is a wrapper with some command validations.
     *
     * @param {Array|String} commands
     * @param {Boolean=} selfEcho
     * @returns {Promise|Error}
     */
    execPromise: async (commands, selfEcho = false) => {
        if (Object.prototype.toString.call(commands) === '[object Array]') {
            commands = commands
                .filter(item => typeof item !== 'undefined')
                .join(' ');
        } else if (typeof commands === 'string') {
            if (!commands.length) {
                throw Error(`exec.command '${JSON.stringify(commands)}' (${typeof commands}) is empty!`);
            }
            commands = commands.trim();
        } else {
            throw Error(`exec.command '${JSON.stringify(commands)}' (${typeof commands}) not supported!`);
        }
        const { stderr, stdout } = await execPromiseModule(commands);
        if (stderr) {
            throw Error(stderr);
        }

        if (!selfEcho) {
            return stdout;
        }
    },
    processScriptArguments: async () => {
        const [, , ...rawArgs] = (process.argv);

        let { argList, cmdList } = rawArgs.reduce((argsObj, arg) => {

            if (new RegExp('-{1,2}([-a-z]+)=?([\.\/_\w]+)?').test(arg)) {
                const { argName, argValue } = helper.destructArguments(arg);
                if (typeof arg !== 'undefined') {
                    argsObj.argList.push({
                        key: argName,
                        value: argValue,
                    });
                }
            } else {
                // Replace short commands with the original ones.
                argsObj.cmdList.push((arg in SHORT_COMMAND_MAPPING)
                    ? SHORT_COMMAND_MAPPING[arg]
                    : arg);
            }

            return argsObj;
        }, {
            argList: [],
            cmdList: [],
        });

        if (!cmdList.length) {
            return {
                cmdList: [
                    '--help',
                ],
                argList: [],
            }
        }

        /**
         * Since the script can be executed globally and anywhere,
         * we have to obtain the current directory path
         */
        const pwd = await helper.execPromise('pwd');

        return {
            cmdList,
            argList,
            workingDirectory: (pwd !== process.argv[1])
                ? pwd.trim()
                : process.argv[1],
        };
    },
    destructArguments: (arg) => {
        const matches = arg.match(new RegExp('-{1,2}([-a-z]+)=?([\.\/_\\w]+)?'));
        if (matches !== null) {
            let [, argName, argValue] = matches;

            // Replace short arguments with the original ones.
            if (argName in SHORT_ARGUMENT_MAPPING) {
                argName = SHORT_ARGUMENT_MAPPING[argName];
            }

            if (typeof argValue === 'string') {
                if (['true', 'false'].includes(value)) {
                    argValue = (argValue === 'true');
                } else {
                    argValue = `${argValue}`.toLowerCase();
                }
            }

            return {
                argName,
                argValue,
            }
        }
    },
};

module.exports = helper;
