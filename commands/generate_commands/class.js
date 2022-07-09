// MOST Web Framework Copyright (c) 2017-2022, THEMOST LP All rights reserved
const writeFileFromTemplate = require('../../util').writeFileFromTemplate;
const getConfiguration = require('../../util').getConfiguration;
const SimpleDataContext = require('../../util').SimpleDataContext;
const getBuilder = require('../../util').getBuilder;
const getDataConfiguration = require('../../util').getDataConfiguration;
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');


function generateAnyClass(argv) {
    
    //get cli options
    let options = getConfiguration();
    //get data configuration
    let config = getDataConfiguration(options);
    //get OData Builder
    let builder = getBuilder(config);
    let sources = [];
    return builder.getEdm().then((schema)=> {
        console.log('INFO', argv);
        if (argv.name === 'app' || argv.name === '*') {
            sources = schema.entityType.map((x)=> {
                return generateClass(Object.assign({
                    inProcClass:[]
                }, argv, {
                    "name": x.name,
                    "silent": true
                }), true);
            });
        }
        else {
            sources = argv.name.split('+').map((x)=> {
                return generateClass(Object.assign({
                    inProcClass:[]
                }, argv, {
                    "name": x,
                    "silent": true
                }), false);
            });
        }
        return Promise.all(sources);
    });
    
}

module.exports.generateAnyClass = generateAnyClass;

function generateClass(argv, ignoreOther) {
    return new Promise((resolve, reject) => {
        //get cli options
        let options = getConfiguration();
        //get data configuration
        let config = getDataConfiguration(options);
        //validating name
        if (!/^[a-zA-Z0-9_-]+$/.test(argv.name)) {
            console.error('ERROR', 'An error occurred while validating class name.');
            return reject(new Error('Class name is not valid. Expected only latin characters, numbers or "_,-" characters.'));
        }
        //--
        let context = new SimpleDataContext(config);
        argv.inProcClass = argv.inProcClass || [];
        if (argv.inProcClass.indexOf(argv.name)>=0) {
            return resolve();
        }
        //get OData Builder
        let builder = getBuilder(config);
        return builder.getEdm().then(()=> {
                //get model definition
                let emptyModel = {
                        name: _.upperFirst(_.camelCase(argv.name)),
                        fields: [],
                        attributes:[],
                        inherits: null
                    };
                let dataTypes = config.getDataConfiguration().dataTypes;
                let model = context.model(argv.name) || emptyModel;
                model.inherits = model.inherits || null; 
                model.imports = [];
                if (model.inherits) {
                    model.inheritsClassPath = "./".concat(_.dasherize(model.inherits).concat('-model'));
                    model.imports.push({
                      "name": model.inherits,
                      "from": model.inheritsClassPath
                    });
                }
                else {
                    model.imports.push({
                      "name": "{DataObject}",
                      "from": "@themost/data/data-object"
                    });
                }
                model.attributes.forEach((x)=> {
                   //format data type
                    let dataType = dataTypes[x.type];
                    if (typeof x.type === 'undefined') {
                        x.typeName = x.many ?  "Array<*>" : "*";
                        return;
                    }
                    if (!x.hasOwnProperty('nullable')) {
                        x.nullable = true;
                    }
                    //add import
                    if (x.model === model.name) {
                        let importModel = context.model(x.type);
                        if (importModel && importModel.name !== model.name) {
                            if (typeof model.imports.find((x)=> { return x.name === importModel.name }) === 'undefined') {
                                model.imports.push({
                                    "name": importModel.name,
                                    "from": "./".concat(_.dasherize(importModel.name).concat('-model'))
                                });    
                            }
                            x.typeName = x.many ?  "Array<" + x.type + "|any>" : x.type + "|any";
                            return;
                        }    
                    }
                    if (dataType) {
                        x.typeName = x.many ?  "Array<" + dataType.type + ">" : dataType.type;
                        return;
                    }
                    x.typeName = x.many ?  "Array<" + x.type + ">" : x.type;
                });
                //get file name
                let destFile = _.dasherize(argv.name).concat('-model').concat(options.mode==='typescript' ? '.ts': '.js');
                console.log('INFO', `Generating class ${destFile}`);
                let destPath = path.resolve(process.cwd(), options.base, `models/${destFile}`);
                console.log('INFO', `Validating class path ${destPath}`);
                if (fs.existsSync(destPath) && !argv.force) {
                    if (argv.silent) {
                        console.error('WARNING', `The specified class [${argv.name}] already exists.`);
                        return resolve();
                    }
                    console.error('ERROR', 'An error occurred while validating class.');
                    return reject(new Error('The specified class already exists.'));
                }
                //get template file path
                let templateFile = path.resolve(__dirname, '../../templates/generate/class'+(options.mode==='typescript' ? '.ts': '.js')+'.ejs');
                //get destination folder path
                let destFolder = path.dirname(destPath);
                console.error('INFO', `Validating class folder (${destFolder}).`);
                fs.ensureDir(destFolder, (err) => {
                    if (err) {
                        console.error('ERROR', 'An error occurred while validating destination path.');
                        return reject(err);
                    }
                    writeFileFromTemplate(templateFile, destPath, model).then(() => {
                        console.log('INFO', 'The operation was completed succesfully.');
                        if (ignoreOther) {
                            return resolve();
                        }
                        //add in-process class
                        argv.inProcClass.push(model.name);
                        let generateExtra = model.imports.filter((x)=> {
                           return x.name !== "{DataObject}" && x.name !== model.name;
                        }).map((x)=> {
                            return generateClass(Object.assign({}, argv, {
                                    "name": x.name,
                                    "silent": true
                                }));
                        });
                        Promise.all(generateExtra).then(()=> {
                            if (options.mode==='typescript') {
                                return resolve();
                            }
                            return resolve();
                        }).catch((err)=> {
                            return reject(err);
                        });
                    }).catch((err) => {
                        console.error('ERROR', 'An error occurred while generating data model class.');
                        return reject(err);
                    });
                });
        });
    });
}

module.exports.generateClass = generateClass;

module.exports.command = 'class <name>';

module.exports.desc = 'Generate a new data model class';

module.exports.builder = function builder(yargs) {
    return yargs.option('silent', {
        default: false,
        describe: 'disable errors'
    }).option('force', {
        default: false,
        describe: 'replace if exists'
    });
};

module.exports.handler = function handler(argv) {
    generateAnyClass(argv).then(() => {
        return process.exit(0);
    }).catch((err) => {
        console.error(err);
        return process.exit(1);
    });
};
