// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const path = require('path');
const { isInteractive, stripInteractive, startInteractive } = require('./interactive');

const args = process.argv.slice(2);

if (isInteractive(args)) {
    // start an interactive shell and execute the given command, if any
    startInteractive(stripInteractive(args));
} else {
    process.on('unhandledRejection', (reason, p) => {
        console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
        // application specific logging, throwing an error, or other logic here
    });

    require('yargs')
        .commandDir(path.resolve(__dirname, 'commands'))
        .option('interactive', {
            alias: 'i',
            type: 'boolean',
            describe: 'starts an interactive shell for executing commands against the same application instance'
        })
        .demandCommand()
        .help()
        .argv;
}
