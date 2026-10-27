// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const path = require('path');
const { isInteractive, stripInteractive, startInteractive } = require('./interactive');

const args = process.argv.slice(2);

if (args.length === 0) {
    args.push('--interactive');
}

if (isInteractive(args)) {
    // start an interactive shell and execute the given command, if any
    startInteractive(stripInteractive(args)).then(() => void 0);
} else {
    process.on('unhandledRejection', (reason, p) => {
        console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
        // application specific logging, throwing an error, or other logic here
    });

    const { hideBin } = require('yargs/helpers');
    const cli = require('yargs')(hideBin(process.argv))
        .commandDir(path.resolve(__dirname, 'commands'))
        .option('interactive', {
            alias: 'i',
            type: 'boolean',
            describe: 'starts an interactive shell for executing commands against the same application instance'
        })
        .demandCommand()
        .help()
        .exitProcess(false);
    (async function main() {
        // main execution logic of the CLI application
        try {
            await cli.parseAsync();
            // eslint-disable-next-line no-process-exit
            return process.exit(0);
        } catch (err) {
            console.error('ERROR', err);
            const exitCode = err.exitCode ? err.exitCode : 1;
            // eslint-disable-next-line no-process-exit
            return process.exit(exitCode);
        }
    })();
}
