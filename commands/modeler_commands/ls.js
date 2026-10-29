// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const {ModelGenerator} = require('../../modeler/modeler');
const {createLogger} = require('../../util');
const Table = require('easy-table');
const {  truncate } = require('lodash');

module.exports.command = 'ls [model]';
module.exports.desc = 'Lists available models';

module.exports.builder = function builder(yargs) {
    return yargs;
};

module.exports.handler = function (argv) {
    // get options
    const logger = createLogger();
    // get output directory
    const generator = new ModelGenerator();
    return generator.getList().then( function(list) {
        const res = list.map(function(x) {
            x.description = truncate(x.description, {
                    length: 32
                });
            return x;
        });
        if (argv.model) {
            const re = new RegExp(argv.model, 'ig');
            const finalRes = res.filter(function(x) {
                return re.test(x.name) || re.test(x.subClassOf);
            });
            if (finalRes.length === 0) {
                logger.info(`There are no models matching "${argv.model}".`);
                return Promise.resolve();
            }
            process.stdout.write(Table.print(finalRes));
        }
        else {
            process.stdout.write(Table.print(res));
        }
        return Promise.resolve();
    }).catch((err) => {
        logger.error('An error occurred while listing models.');
        return Promise.reject(err);
    });
}
