#!/usr/bin/env node

'use strict';


const { extname } = require('path');
const { existsSync, watch } = require('fs');
const {
    processScriptArguments,
    execModule,
    buildCommandList,
    checkTerraformApp,
} = require('./helper');

let exitScript = true;

/**
 * In case you want to do something when the script has closed,
 * here's the place to be!
 *
 * @param {String=} exitCode
 */
const exitHandler = (exitCode) => {
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

    // TODO: Check for the platform and os and rewrite path delimiters and such!!
    // TODO: Check for the platform and os and rewrite path delimiters and such!!
    // TODO: Check for the platform and os and rewrite path delimiters and such!!
    // TODO: Check for the platform and os and rewrite path delimiters and such!!

    /**
     * Make sure that the `terraform` app is installed!
     * @type {boolean}
     */
    const terraformExists = await checkTerraformApp();
    if (!terraformExists) {
        throw Error(`'terraform' application not found. Please download and install 'terraform' first: https://www.terraform.io/downloads.html`)
    }

    const {
        cmdList,
        argList,
        workingDirectory
    } = await processScriptArguments();

    // Stop the script gracefully
    if (argList.find(arg => arg === 'test')) {
        return exitHandler('ok');
    }

    const commandList = buildCommandList(argList, cmdList);

    // Execute the command with all its arguments.
    execModule(commandList, true);

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
        console.error(err.message);
        exitHandler();
    }
});
