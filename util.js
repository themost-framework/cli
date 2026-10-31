/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
const _ = require('lodash');
const ejs = require('ejs');
const fs = require('fs-extra');
const path = require('path');
const {TraceUtils} = require('@themost/common');

const configurationDefaults = {
    "base":"server",
    "out": "dist/server"
};

/**
 *
 * @param s
 * @returns {*}
 * @private
 */
function _dasherize(s) {
    if (_.isString(s))
        return _.trim(s).replace(/[_\s]+/g, '-').replace(/([A-Z])/g, '-$1').replace(/-+/g, '-').replace(/^-/,'').toLowerCase();
    return s;
}

/**
 * @method dasherize
 * @memberOf _
 */
if (typeof _.dasherize !== 'function') {
    _.mixin({'dasherize' : _dasherize});
}

function writeFileFromTemplate(source, dest, data) {
    return ejs.renderFile(source, data).then((res)=> {
        return new Promise((resolve, reject)=> {
            //write file
            fs.writeFile(dest, res, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    });
}

module.exports.writeFileFromTemplate = writeFileFromTemplate;

function contentFromTemplate(source, data) {
    return ejs.renderFile(source, data);
}

module.exports.contentFromTemplate = contentFromTemplate;

function loadConfiguration() {
    let config = require(path.resolve(process.cwd(), '.themost-cli.json'));
    return Object.assign({}, configurationDefaults, config);
}

module.exports.loadConfiguration = loadConfiguration;

function getConfiguration() {
    try {
        return loadConfiguration();
    }
    catch(err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.error('ERROR','Configuration cannot be found. It seems that current working directory does not contain a MOST Web Framework project.');
        }
        else {
            console.error('ERROR','An error occurred while loading configuration.');
        }
        throw err;
    }
}

module.exports.getConfiguration = getConfiguration;

class SimpleDataContext {
    constructor(configuration) {
        this.getConfiguration = ()=> configuration;
    }
    getStrategy(strategyCtor) {
        return this.getConfiguration().getStrategy(strategyCtor);
    }

    model(name) {
        let self = this;
        if ((name === null) || (name === undefined))
            return null;
        let obj = self.getConfiguration().getStrategy(function DataConfigurationStrategy() {}).model(name);
        if (_.isNil(obj)) {
            return null;
        }
        //do some things for CLI only
        //remove class path if any
        delete obj.classPath;
        //clear event listeners
        obj.eventListeners = [];
        let dataModule = require.resolve('@themost/data',{
            paths:[path.resolve(process.cwd(), 'node_modules')]
        });
        // noinspection JSUnresolvedReference
        let DataModel = require(dataModule).DataModel,
            model = new DataModel(obj);
        //set model context
        model.context = self;
        //return model
        return model;
    }

}

module.exports.SimpleDataContext = SimpleDataContext;

module.exports.getDataConfiguration = function getDataConfiguration(options) {
    let DataConfiguration;
    try {
        let dataModule = require.resolve('@themost/data/data-configuration',{
            paths:[path.resolve(process.cwd(), 'node_modules')]
        });
        // noinspection JSUnresolvedReference
        DataConfiguration = require(dataModule).DataConfiguration;
    }
    catch(err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.error('ERROR','MOST Web Framework data configuration module cannot be found.');
        }
        else {
            console.error('ERROR','An error occurred while trying to initialize data configuration.');
        }
        throw err;
    }
    console.log('INFO','Initializing configuration');
    let res = new DataConfiguration(path.resolve(process.cwd(), options.base, 'config'));
    //modify data configuration strategy
    let dataConfigurationStrategy = res.getStrategy(function DataConfigurationStrategy() {});
    let getModel = dataConfigurationStrategy.model;
    dataConfigurationStrategy.model = function(name) {
        let model = getModel.bind(this)(name);
        if (model) {
            //do some things for CLI only
            //remove class path if any
            delete model.classPath;
            //clear event listeners
            model.eventListeners = [];
        }
        return model;
    };

    return res;

};

module.exports.getBuilder = function getBuilder(config) {
    let ODataConventionModelBuilder;
    let dataModule = require.resolve('@themost/data',{
        paths:[path.resolve(process.cwd(), 'node_modules')]
    });
    // noinspection JSUnresolvedReference
    ODataConventionModelBuilder = require(dataModule).ODataConventionModelBuilder;

    let dataObjectModule = require.resolve('@themost/data',{
        paths:[path.resolve(process.cwd(), 'node_modules')]
    });
    //disable data model class loader
    config.getStrategy(function ModelClassLoaderStrategy() {}).resolve = function() {
        // noinspection JSUnresolvedReference
        return require(dataObjectModule).DataObject;
    };
    return new ODataConventionModelBuilder(config);
};

/**
 * The application instance which is shared across commands e.g. in interactive mode
 * @type {*}
 */
let currentApplication = null;

/**
 * Returns the current application instance or creates a new one if it does not exist
 * @param {*} options
 * @returns {*}
 */
module.exports.getApplication = function getApplication(options) {
    if (currentApplication == null) {
        currentApplication = createApplication(options);
    }
    return currentApplication;
};

function createApplication(options) {
    let ApplicationClassOrFunction;
    if (options.application) {
        // try to create application from custom module
        let [customModule, className] = options.application.split('#');
        if (customModule.startsWith('.')) {
            customModule = path.resolve(process.cwd(), customModule);
        }
        if (className) {
            ApplicationClassOrFunction = require(customModule)[className];
            // create a new instance of application passing the output directory as the current path
            return new ApplicationClassOrFunction(path.resolve(process.cwd(), options.out));
        }
        // the module itself exports a function which returns the application
        const applicationFactory = require(customModule);
        if (typeof applicationFactory !== 'function') {
            throw new Error(`Invalid application module. The module ${options.application} does not export a function.`);
        }
        return applicationFactory(path.resolve(process.cwd(), options.out));
    }
    try {
        // eslint-disable-next-line node/no-missing-require
        const applicationModule = require.resolve('@themost/express',{
            paths:[
                path.resolve(process.cwd(), 'node_modules')
            ]
        });
        // noinspection JSUnresolvedReference
        ApplicationClassOrFunction = require(applicationModule).ExpressDataApplication;
    }
    catch(err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.error('ERROR','MOST Web Framework module cannot be found.');
        }
        else {
            console.error('ERROR','An error occurred while trying to initialize MOST Web Framework Application.');
            console.error(err);
        }
        throw err;
    }
    console.log('INFO','Initializing application');
    return new ApplicationClassOrFunction(path.resolve(process.cwd(), options.out, 'config'));
}

module.exports.createLogger = function createLogger() {
    if (typeof TraceUtils.newLogger === 'function') {
        return TraceUtils.newLogger();
    }
    // get first symbol property of TraceUtils
    const traceLoggerSymbol = Object.getOwnPropertySymbols(TraceUtils).find((s) => s.toString() === 'Symbol(logger)');
    if (traceLoggerSymbol) {
        return Object.create(TraceUtils[traceLoggerSymbol]);
    }
}

module.exports.createApplication = createApplication;
