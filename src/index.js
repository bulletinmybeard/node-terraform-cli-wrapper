#!/usr/bin/env node

const { promisify } = require('util');
const { execSync, exec } = require('child_process');
const execPromiseModule = promisify(exec);

const { extname } = require('path');
const { existsSync, watch } = require('fs');

const LOG_LEVELS = [
    'trace',
    'debug',
    'info',
    'warn',
    'error',
];

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
};

/**
 * `getScriptArgs` processes and validates all given script arguments.
 *
 * @returns {Object}
 */
const getScriptArgsAndStuff = async () => {

    let command = (process.argv)[2];
    if (typeof command === 'undefined') {
        command = '-help';
    }

    // Replace short commands with the original ones.
    if (command in SHORT_COMMAND_MAPPING) {
        command = SHORT_COMMAND_MAPPING[command];
    }

    // Skipe the node binary and absolute script path.
    const args = (process.argv).slice(3);

    // Filter and format values (if necessary!).
    const arguments = args.reduce((args, arg) => {
        const matches = arg.match(new RegExp('-{1,2}([-a-z]+)=?([\\.\\/_\\w]+)?'));
        if (matches !== null) {
            let [, key, value] = matches;

            // Replace short arguments with the original ones.
            if (key in SHORT_ARGUMENT_MAPPING) {
                key = SHORT_ARGUMENT_MAPPING[key];
            }

            if (typeof value === 'string') {
                if (['true', 'false'].includes(value)) {
                    value = (value === 'true');
                } else {
                    value = `${value}`.toLowerCase();
                }
            }

            args[key] = value;
        }
        return args;
    }, {});

    /**
     * Since the script can be executed globally and anywhere,
     * we have to obtain the current directory path
     */
    const pwd = await execPromise('pwd');
    const workingDirectory = (pwd !== args.dirname)
        ? pwd.trim()
        : args.dirname;

    return {
        command,
        workingDirectory,
        arguments
    };
};

/**
 * `execPromise` is a wrapper with some command validations.
 *
 * @param {Array|String} commands
 * @param {Boolean=} selfEcho
 * @returns {Promise|Error}
 */
const execPromise = async (commands, selfEcho = false) => {
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
};

/**
 * `execModule` works similar to `execPromise`,
 * but without being asynchronous and return value
 *
 * @param {Array|String} commands
 * @param {Boolean=} silenzio
 * @returns (Undefined)
 */
const execModule = (commands, silenzio = true) => {
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
};

/**
 * `buildCommandList` builds an Array containing the terraform command and arguments.
 *
 * @param {Array} arguments
 * @param {String} command
 * @returns {Array}
 */
const buildCommandList = (arguments, command) => {

    let commandList = [
        'terraform',
        command,
    ];

    const logLevel = Object
        .keys(arguments)
        .find((key) =>
            LOG_LEVELS.includes(key));

    if (typeof logLevel !== 'undefined') {
        commandList = [...[ 'export', `TF_LOG="${logLevel}" &&` ], ...commandList];
    }

    return [...commandList, ...Object.entries(arguments).reduce((args, [key, value]) => {
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
};

let exitScript = true;

/**
 * In case you want to do something when the script has closed,
 * here's the place to be!
 *
 * @param {String=} exitCode
 */
exitHandler = (exitCode) => {
    // Gracefully exit.
    if (exitCode === 'ok') {
        return process.exit(0);
    }
    // Error exit.
    process.exit(1);
};

// Listen to exit events and call `exitHandler`.
process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', exitHandler);

(async () => {

    const { command, workingDirectory, arguments } = await getScriptArgsAndStuff();

    // Stop the script gracefully
    if ('test' in arguments) {
        return exitHandler('ok');
    }

    const commandList = buildCommandList(arguments, command);

    // Execute the command with all its arguments.
    execModule(commandList);

    /**
     * Using the script argument `--watch` will attach a watcher to the directory
     * where `terra` is running. You can also add a custom directory path
     * via `--watch=<relative_or_absolutedirectory_path>`.
     */
    if ('watch' in arguments) {

        const watchFolder = (typeof arguments.watch !== 'undefined')
            ? arguments.watch
            : workingDirectory;

        if (!existsSync(watchFolder)) {
            throw Error(`--watch=<folder?> (${watchFolder}) not found`);
        }

        try {
            exitScript = false;
            /**
             * Attach watcher and monitor file changes. Re-run the given command including its arguments if
             */
            watch(watchFolder, {
                recursive: true,
            }, (eventType, filename) => {
                if (filename.charAt(0) !== '.'
                    && [
                        '.tf',
                        '.tfvars',
                    ].includes(extname(filename))) {
                    console.log(`Re-run command '${commandList.join(' ')}'\n\r`);
                    execModule(commandList);
                }
            });
        } catch (err) {
            return;
        }
    }

    // We don't want the script to end if we have a watcher attached or smth.
    if (exitScript) {
        exitHandler('ok');
    }
})().catch(err => {
    if (exitScript) {
        console.error(err);
        exitHandler();
    }
});
