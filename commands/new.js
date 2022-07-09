// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const path = require('path');

module.exports.command = 'new <command>';

module.exports.desc = 'Create a new component';

module.exports.builder = function builder(yargs) {
    return yargs.commandDir(path.resolve(__dirname, 'new_commands'));
};

module.exports.handler = function handler() {

};
