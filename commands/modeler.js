// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const path = require('path');

module.exports.command = 'modeler <command>';

module.exports.desc = 'Use modeler to manage data models';

module.exports.builder = function builder(yargs) {
    return yargs.commandDir(path.resolve(__dirname, 'modeler_commands'));
};

module.exports.handler = function handler() {

};
