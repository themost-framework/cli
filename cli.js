// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const path = require('path');

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

require('yargs')
    .commandDir(path.resolve(__dirname, 'commands'))
    .demandCommand()
    .help()
    .argv;
