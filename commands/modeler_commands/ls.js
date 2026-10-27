// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const ModelGenerator = require('../../modeler/modeler').ModelGenerator;
const {getConfiguration, createLogger} = require('../../util');
const path = require('path');
const Table = require('easy-table');
const _ = require('lodash');

module.exports.command = 'ls [model]';
module.exports.desc = 'Lists available models';

module.exports.builder = function builder(yargs) {
    return yargs;
};


module.exports.handler = function (argv) {
    // get options
    const options = getConfiguration();
    const logger = createLogger();
    // get output directory
    const outDir = path.resolve(process.cwd(), options.base, 'config/models/');
    const generator = new ModelGenerator();
    return generator.getList().then( function(list) {
        const res = _.map(list, function(x) {
            if (x.description.length>32) {
                x.description = x.description.substr(0,29).concat('...');
            }
            return x;
        });
        if (argv.model) {
            const re = new RegExp(argv.model, 'ig');
            const finalRes = _.filter(res, function(x) {
                return re.test(x.name) || re.test(x.subClassOf);
            });
            console.log(Table.print(finalRes));
        }
        else {
            console.log(Table.print(res));
        }
        return Promise.resolve();
    }).catch((err) => {
        logger.error('An error occurred while listing models.', err);
        return Promise.reject(err);
    });
}
