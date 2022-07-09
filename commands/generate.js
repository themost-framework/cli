// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const path = require('path');

module.exports.command = 'generate <command>';

module.exports.desc = 'Generate a new component';

module.exports.builder = function builder(yargs) {
    return yargs.commandDir(path.resolve(__dirname, 'generate_commands'));
};

module.exports.handler = function handler() {

};
