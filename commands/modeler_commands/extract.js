// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const {getConfiguration, createLogger, getApplication} = require('../../util');
const path = require('path');
const {generateOnlyModel} = require('../../modeler/modeler');
const postFormatters = require('../../modeler/postFormatters');
require('@themost/promise-sequence');
const fs = require('fs');

module.exports.command = 'extract <model> [options]';
module.exports.desc = 'Extracts the specified model';

module.exports.builder = function builder(yargs) {
    return yargs;
};


module.exports.handler = function (argv) {
    // get options
    let options = getConfiguration();
    const logger = createLogger();
    // get output directory
    let outDir = path.resolve(process.cwd(), options.base, 'config/models/');
    // generate model
    const sources = [
        () => generateOnlyModel(argv.model, outDir),
        () => generateOnlyModel('User', outDir),
        () => generateOnlyModel('Permission', outDir)
    ];
    return Promise.sequence(sources).then((results)=> {
        // validate results
        const expected = results.find((r) => r && r.name === argv.model);
        if (!expected) {
            logger.error(`Model "${argv.model}" could not be found`);
            return Promise.resolve();
        }
        // results is an array of model objects returned by generateOnlyModel
        const models = results.reduce((acc, val) => {
            return acc.concat(val);
        }, []);
        // execute post formatters for each model
        const options = getConfiguration();
        const app = getApplication(options);

        return app.execute((context) => {
            // override context model and return an in-process model if exists
            const superModel = context.model.bind(context);
            context.model = (name) => {
                const model = models.find((m) => m.name === name);
                if (model) {
                    return model;
                }
                return superModel(name);
            };
            models.forEach((model) => {
                Object.keys(postFormatters).filter((key) => typeof postFormatters[key] === 'function').map((key) => {
                    return postFormatters[key];
                }).forEach((format) => format(context, model));
            });
            return Promise.sequence(models.map((model)=> {
                return () => new Promise((resolve, reject) => {
                    const modelPath = path.resolve(outDir, model.name.concat('.json'));
                    return fs.writeFile(modelPath, JSON.stringify(model, null, 4), (err)=> {
                        if (err) {
                            return reject(err);
                        }
                        logger.info(`Model "${model.name}" has been successfully created.`);
                        return resolve();
                    });
                });
            })).then(() => Promise.resolve());
        });        
    }).then(()=> {
        logger.info('The operation was completed successfully.');
        return Promise.resolve();
    }).catch((err)=> {
        logger.error('An error occurred while extracting model.');
        return Promise.reject(err);
    });
}
