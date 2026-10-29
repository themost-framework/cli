// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const ModelGenerator = require('../../modeler/modeler').ModelGenerator;
const { createLogger} = require('../../util');
const Table = require('easy-table');
const { truncate } = require('lodash');

module.exports.command = 'info <model>';
module.exports.desc = 'Outputs model definition. This command is deprecated. Use inspect instead.';

module.exports.builder = function builder(yargs) {
    return yargs;
};

module.exports.handler = function (argv) {
    const logger = createLogger();
    const generator = new ModelGenerator();

    function getFieldsForPrint(fields) {
        return fields.map(function(x) {
            return {
                name: x.name,
                description: truncate(x.description, {
                    length:32
                }),
                type: x.type
            }
        });
    }

    function getFields(generator, name) {
        return generator.getModel(name).then( function(model) {
            if (model.implements) {
                return getFields(generator, model.implements).then( function(implementedFields) {
                    const res = implementedFields.map(function(x) {
                        if (x.from == null) {
                            x.from = model.implements;
                        }
                        return x;
                    });
                    res.push.apply(res, getFieldsForPrint(model.fields));
                    return Promise.resolve(res);
                });
            } 
            else if (model.inherits) {
                return getFields(generator, model.inherits).then( function(inheritedFields) {
                    const res = inheritedFields.map(function(x) {
                        if (x.from == null) {
                            x.from = model.inherits;
                        }
                        return x;
                    });
                    res.push.apply(res, getFieldsForPrint(model.fields));
                    return Promise.resolve(res);
                });
            }
            else {
                return Promise.resolve(getFieldsForPrint(model.fields));
            }
        });
    }
    
    
        return generator.getModel(argv.model).then( function(model) {
            if (model == null) {
                logger.info('The specified model cannot be found.');
                return Promise.resolve();
            }
            // print model attributes
            process.stdout.write('\n');
            process.stdout.write('Properties\n');
            process.stdout.write('---\n');
            const modelToPrint = {
                name: model.name,
                description: truncate(model.description, {
                    length: 80
                })
            };
            if (model.inherits) {
                modelToPrint.inherits = model.inherits;
            }
            if (model.implements) {
                modelToPrint.implements = model.implements;
            }
            process.stdout.write(Table.print(modelToPrint));
            process.stdout.write('\n');
            return getFields(generator, argv.model).then(function(fields) {
                // print model attributes
                process.stdout.write('Fields\n');
                process.stdout.write('---\n');
                process.stdout.write(Table.print(fields));
            });
        });
}
