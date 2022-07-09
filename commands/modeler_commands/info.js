/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
const ModelGenerator = require('../../modeler/modeler').ModelGenerator;
const getConfiguration = require('../../util').getConfiguration;
const path = require('path');
const Table = require('easy-table');
const _ = require('lodash');

module.exports.command = 'info <model>';
module.exports.desc = 'Outputs model definition';

module.exports.builder = function builder(yargs) {
    return yargs;
};



module.exports.handler = function (argv) {
    // get options
    let options = getConfiguration();
    // get output directory
    let outDir = path.resolve(process.cwd(), options.base, 'config/models/');
    const generator = new ModelGenerator();

    function getFieldsForPrint(fields) {
        return _.map(fields, function(x) {
            return {
                name: x.name,
                description: _.truncate(x.description, {
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
                    const res = _.forEach(implementedFields, function(x) {
                        if (x.from == null) {
                            x.from = model.implements;
                        }
                    });
                    res.push.apply(res, getFieldsForPrint(model.fields));
                    return Promise.resolve(res);
                });
            } 
            else if (model.inherits) {
                return getFields(generator, model.inherits).then( function(inheritedFields) {
                    const res = _.forEach(inheritedFields, function(x) {
                        if (x.from == null) {
                            x.from = model.inherits;
                        }
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
                console.log('INFO','The specifiec model cannot be found.');
                return;
            }
            // print model attributes
            console.log('');
            console.log('Properties');
            console.log('--------------');
            const modelToPrint = {
                name: model.name,
                description: model.description
            };
            if (model.inherits) {
                modelToPrint.inherits = model.inherits;
            }
            if (model.implements) {
                modelToPrint.implements = model.implements;
            }
            console.log(Table.print(modelToPrint));
            getFields(generator, argv.model).then(function(fields) {
                // print model attributes
                console.log('');
                console.log('Fields');
                console.log('--------------');
                console.log(Table.print(fields));
            });
        });
}
