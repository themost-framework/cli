/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const XDocument = require('@themost/xml').XDocument;
const DOMParser = require('@xmldom/xmldom').DOMParser;
const formatters = require('./formatters');

const formattersProperty = 'formatters';
const labelProperty = "rdfs:label";
const commentProperty = "rdfs:comment";
const graphProperty = "@graph";
const typeProperty = "@type";
const idProperty = "@id";
const subClassProperty = "rdfs:subClassOf";
const domainIncludesProperty = "http://schema.org/domainIncludes";
const rangeIncludesProperty = "http://schema.org/rangeIncludes";

const DEFAULT_SCHEMA = JSON.parse(fs.readFileSync(path.resolve(__dirname,'schemas/schema.jsonld')));
const THEMOST_SCHEMA = JSON.parse(fs.readFileSync(path.resolve(__dirname,'schemas/themost.jsonld')));
const XMLSCHEMA_SCHEMA = JSON.parse(fs.readFileSync(path.resolve(__dirname,'schemas/xmlschema.jsonld')));

DEFAULT_SCHEMA[graphProperty].push.apply(DEFAULT_SCHEMA[graphProperty], XMLSCHEMA_SCHEMA[graphProperty]);
DEFAULT_SCHEMA[graphProperty].push.apply(DEFAULT_SCHEMA[graphProperty], THEMOST_SCHEMA[graphProperty]);

const XML_SCHEMA = "http://www.w3.org/2001/XMLSchema#";


class SchemaLoader {
    getSchema() {
        return new Promise((resolve) => {
            return resolve(DEFAULT_SCHEMA);
        });
    }
}

function isRdfsClass(schema, name) {
    let rdfsClass = schema[graphProperty].find((x) => {
        return x[typeProperty] === "rdfs:Class" && x[labelProperty] === name;
    });
    if (typeof rdfsClass === 'undefined') {
        return false;
    }
    //check if class is a data type
    if (Array.isArray(rdfsClass["@type"]) && rdfsClass["@type"].indexOf("http://schema.org/DataType")>=0) {
        return false;
    }
    if (typeof rdfsClass["@type"] === 'string' && rdfsClass["@type"]==="http://schema.org/DataType") {
        return false;
    }
    if (typeof rdfsClass["rdfs:subClassOf"] === 'object') {
        let superRdfsClass = schema[graphProperty].find((x) => {
            return x["@id"] === rdfsClass["rdfs:subClassOf"]["@id"];
        });
        if (superRdfsClass) {
            //check if class is a data type
            if (Array.isArray(superRdfsClass["@type"]) && superRdfsClass["@type"].indexOf("http://schema.org/DataType")>=0) {
                return false;
            }
            if (typeof superRdfsClass["@type"] === 'string' && superRdfsClass["@type"]==="http://schema.org/DataType") {
                return false;
            }
        }
    }
    return true;
}

/**
 * @this ModelGenerator
 * @param {string} name
 * @param {Array<*>} outCollection
 * @returns Promise
 */
function extractModelInternal(name, outCollection) {
    outCollection = outCollection || [];
    let self = this;
    if (outCollection.find((x)=> {
        return x.name === name;
    })) {
        return Promise.resolve();
    }
    return this.loader.getSchema().then((schema)=> {
        return self.getModel(name).then((model)=> {
            if (model) {
                if (!isRdfsClass(schema, model.name)) {
                    return Promise.resolve();
                }
                //add model to collection
                outCollection.push(model);
                let searchFor = [];
                if (model.inherits) {
                    searchFor.push(model.inherits);
                }
                if (model.implements) {
                    searchFor.push(model.implements);
                }
                model.fields.forEach((x)=> {
                    if (searchFor.indexOf(x.type)<0) {
                        searchFor.push(x.type);
                    }
                });
                let other = searchFor.filter((name)=> {
                    if (!isRdfsClass(schema, name)) {
                        return;
                    }
                    if (outCollection.find((y)=> { return y.name === name })) {
                        return;
                    }
                    return true;
                }).map((x)=> {
                    return extractModelInternal.bind(self)(x,outCollection);
                });
                return Promise.all(other).then(()=> {
                    return Promise.resolve(outCollection);
                });
            }
            return Promise.resolve();
        });
    });
}

module.exports.generateModel = function(model, outDir) {
    let generator = new ModelGenerator();
    return generator.extractModel(model).then((source)=> {
        let sources = _.uniqBy(source, '@id').map((x)=> {
            return new Promise(((resolve1, reject1) => {
                let modelPath = path.resolve(outDir, x.name.concat('.json'));
                if (fs.existsSync(modelPath)) {
                    console.log('INFO',`Model ${x.name} already exists.`);
                    return resolve1();
                }
                return fs.writeFile(modelPath, JSON.stringify(x, null, 4), (err)=> {
                    if (err) {
                        return reject1(err);
                    }
                    console.log('INFO',`Model ${x.name} has been successfully created.`);
                    return resolve1();
                });
            }));
        });
        return Promise.all(sources);
    });
}

class ModelGenerator {

    constructor() {
        this[formattersProperty] = [];
        this.loader = new SchemaLoader();

        Object.keys(formatters).forEach((key)=> {
            if (typeof formatters[key] === 'function') {
                this.formatter(formatters[key]);
            }
        });

    }

    /**
     * @param {Function} func
     */
    formatter(func) {
        if (typeof func !== 'function') {
            throw new TypeError('Formatter must be a function');
        }
        this[formattersProperty].push(func);
    }

    /**
     * @param {string} name
     */
    extractModel(name) {
        let outCollection = [];
        return extractModelInternal.bind(this)(name, outCollection).then(()=> {
           return Promise.resolve(outCollection);
        });
    }

    /**
     * 
     */
    getList() {
        return this.loader.getSchema().then((schema)=> {
            let definitions = _.filter(schema[graphProperty], function(x) {
                return x[typeProperty] === "rdfs:Class";
            });
            return Promise.resolve(_.map(definitions, function(x) {
                const description = new DOMParser().parseFromString( '<div>' + x[commentProperty] + '</div>');
                let subClassOfDefinition;
                if (x[subClassProperty]) {
                    subClassOfDefinition = _.find(schema[graphProperty], function(y) {
                        return y[typeProperty] === "rdfs:Class" && y[idProperty] === x[subClassProperty][idProperty];
                    });
                }
                const res = {
                    "name": x[labelProperty],
                    "description": description.documentElement.textContent.replace(/\n/ig, '')
                }
                if (subClassOfDefinition) {
                    res.subClassOf = subClassOfDefinition[labelProperty]
                }
                return res;
            }));
        });
    }

    /**
     * @param {string} name
     */
    getModel(name)
    {

        return this.loader.getSchema().then((schema)=> {


            let definition = _.find(schema[graphProperty], function(x) {
                return x[typeProperty] === "rdfs:Class" && x[labelProperty] === name;
            });

            if (!isRdfsClass(schema, name)) {
                return Promise.resolve();
            }
            if (_.isNil(definition)) {
                return Promise.reject(new Error('Not Found'));
            }
            let subClassOfDefinition;
            //find super class
            if (definition[subClassProperty]) {
                subClassOfDefinition = _.find(schema[graphProperty], function(x) {
                    return x[typeProperty] === "rdfs:Class" && x[idProperty] === definition[subClassProperty][idProperty];
                });
            }
            //find attributes
            let attributesDefinition = _.filter(schema[graphProperty], function(x) {
                if (_.isArray(x[domainIncludesProperty])) {
                    return x[typeProperty] === "rdf:Property" && x[domainIncludesProperty]
                        && _.find(x[domainIncludesProperty], function(y){
                            return y[idProperty] === definition[idProperty];
                        });
                }
                else {
                    return x[typeProperty] === "rdf:Property" && x[domainIncludesProperty]
                        && (x[domainIncludesProperty][idProperty] === definition[idProperty]);
                }
            });

            let comment = null;
            if (definition[commentProperty]) {
                comment = new DOMParser()
                    .parseFromString('<div>' + definition[commentProperty] + '</div>')
                    .documentElement.textContent.replace(/\n/ig, '');
            }

            let finalDefinition = {
                "@id":definition[idProperty],
                "name":definition[labelProperty],
                "description":comment,
                "title":definition[labelProperty],
                "abstract": false,
                "sealed":false,
                "inherits": _.isNil(subClassOfDefinition) ? null : subClassOfDefinition[labelProperty],
                "implements": null,
                "version": "1.0",
                "fields":_.map(attributesDefinition, function(x) {
                    let comment = null;
                    if (x[commentProperty]) {
                        comment = new DOMParser()
                            .parseFromString('<div>' + x[commentProperty] + '</div>')
                            .documentElement.textContent.replace(/\n/ig, '');
                    }
                    let res  = {
                        "@id": x[idProperty],
                        "name":x[labelProperty],
                        "title":x[labelProperty],
                        "description":comment
                    };
                    let type, rangeIncludes;
                    if (_.isArray(x[rangeIncludesProperty])) {
                        rangeIncludes = x[rangeIncludesProperty][0];
                    }
                    else if (_.isObject(x[rangeIncludesProperty])) {
                        rangeIncludes = x[rangeIncludesProperty];
                    }
                    if (rangeIncludes) {
                        //find type by id
                        type = _.find(schema[graphProperty], function(y) {
                            return y[idProperty] === rangeIncludes[idProperty];
                        });
                        if (typeof type === 'undefined') {
                            type = _.find(DEFAULT_SCHEMA[graphProperty], function(y) {
                                return y[idProperty] === rangeIncludes[idProperty];
                            });
                        }
                        if (_.isObject(type)) {
                            res.type = type[labelProperty];
                        }
                        return res;
                    }

                }),
                "privileges":[
                    {
                        "mask":15,
                        "type":"global"
                    },
                    {
                        "mask":15,
                        "type":"global",
                        "account":"Administrators"
                    }
                ]
            };

            //check if super class is Enumeration
            if (subClassOfDefinition && subClassOfDefinition[idProperty] === 'http://schema.org/Enumeration') {
                //find all enumeration members
                let seedMembers = _.map(_.filter(schema[graphProperty], function(y) {
                    return y["@type"] === finalDefinition[idProperty];
                }), function(y) {
                    return {
                        "name":y[labelProperty],
                        "alternateName": y[labelProperty],
                        "description": y[commentProperty],
                        "url":y[idProperty]
                    }
                });
                if (seedMembers.length) {
                    finalDefinition["seed"] = seedMembers;
                }
            }

            this[formattersProperty].forEach(function (formatterFunc) {
                formatterFunc(finalDefinition);
            });

            // return Q.all(this[formattersProperty].map(function(formatterFunc) {
            //     return formatterFunc(finalDefinition);
            // }));

            Object.keys(finalDefinition).forEach((key)=> {
                if (finalDefinition.hasOwnProperty(key) && finalDefinition[key] === null) {
                    delete finalDefinition[key];
                }
            });

            return Promise.resolve(finalDefinition);
        });


    };

    /**
     * @param file
     * @returns {Promise<any>}
     */
    fromOwl(file) {
        return new Promise((resolve, reject)=> {
            XDocument.load(file,
                /**
                 * @param {Error} err
                 * @param {XDocument} document
                 * @returns {*}
                 */
                (err, document)=> {
                    if (err) {
                        return reject(err);
                    }
                    let output = {
                        "@context": {
                            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                            "xsd": "http://www.w3.org/2001/XMLSchema#"
                        },
                        "@graph": []
                    };

                    let owl = document.documentElement.lookupPrefix('http://www.w3.org/2002/07/owl#');
                    document.documentElement.childNodes.forEach(
                        /**
                         * @param {XNode} element
                         */
                        (element)=> {
                            let item, aboutAttr, rangeAttr;
                            if (element.localName === 'Class') {

                                item = {};
                                item["@id"] = element.getAttribute('rdf:about');
                                item["@type"] = "rdfs:Class";
                                if (element.selectSingleNode('rdfs:comment')) {
                                    item["rdfs:comment"]=element.selectSingleNode('rdfs:comment').innerText();
                                }

                                aboutAttr = element.getAttribute('rdf:about');
                                if (aboutAttr.indexOf('#')>=0) {
                                    item["rdfs:label"]= aboutAttr.substr(aboutAttr.indexOf('#')+1);
                                }
                                else {
                                    item["rdfs:label"]= element.selectSingleNode('rdfs:label').innerText();
                                }


                                if (element.selectSingleNode('rdfs:subClassOf')) {
                                    item["rdfs:subClassOf"]= {
                                        "@id": element.selectSingleNode('rdfs:subClassOf').getAttribute('rdf:resource')
                                    };
                                }
                                output["@graph"].push(item);
                            }
                            else if (element.localName === 'ObjectProperty') {
                                item = {
                                    "@id": element.getAttribute('rdf:about'),
                                    "@type": "rdf:Property",
                                    "http://schema.org/domainIncludes": []
                                };
                                element.selectNodes('rdfs:domain').forEach((child)=> {
                                    item["http://schema.org/domainIncludes"].push({
                                        "@id": child.getAttribute('rdf:resource')
                                    })
                                });
                                if (element.selectSingleNode('rdfs:range')) {
                                    item["http://schema.org/rangeIncludes"]={
                                        "@id": element.selectSingleNode('rdfs:range').getAttribute('rdf:resource')
                                    };
                                }
                                if (element.selectSingleNode('rdfs:comment')) {
                                    item["rdfs:comment"]=element.selectSingleNode('rdfs:comment').innerText();
                                }

                                aboutAttr = element.getAttribute('rdf:about');
                                item["rdfs:label"]= aboutAttr.substr(aboutAttr.indexOf('#')+1);

                                output["@graph"].push(item);

                            }
                            else if (element.localName === 'DatatypeProperty') {
                                item = {
                                    "@id": element.getAttribute('rdf:about'),
                                    "@type": "rdf:Property",
                                    "http://schema.org/domainIncludes": []
                                };
                                element.selectNodes('rdfs:domain').forEach((child)=> {
                                    item["http://schema.org/domainIncludes"].push({
                                        "@id": child.getAttribute('rdf:resource')
                                    })
                                });
                                if (element.selectSingleNode('rdfs:range')) {

                                    rangeAttr = element.selectSingleNode('rdfs:range').getAttribute('rdf:resource');
                                    item["http://schema.org/rangeIncludes"]={
                                        "@id": rangeAttr
                                    };
                                }
                                if (element.selectSingleNode('rdfs:comment')) {
                                    item["rdfs:comment"]=element.selectSingleNode('rdfs:comment').innerText();
                                }

                                aboutAttr = element.getAttribute('rdf:about');
                                item["rdfs:label"]= aboutAttr.substr(aboutAttr.indexOf('#')+1);

                                output["@graph"].push(item);
                            }
                            else if (element.localName === 'NamedIndividual') {

                                aboutAttr = element.getAttribute('rdf:about');

                                item = {
                                    "@id": aboutAttr,
                                    "@type": element.selectSingleNode('rdf:type').getAttribute('rdf:resource'),
                                    "rdfs:label": aboutAttr.substr(aboutAttr.indexOf('#')+1)
                                };
                                output["@graph"].push(item);
                            }
                        });


                    //add custom types
                    output["@graph"].push({
                        "@id": "http://www.w3.org/2001/XMLSchema#string",
                        "@type": [
                            "http://schema.org/DataType",
                            "rdfs:Class"
                        ],
                        "rdfs:comment": "Data type: String.",
                        "rdfs:label": "Text"
                    });

                    return resolve(output);
                });
        });
    }
}

module.exports.ModelGenerator = ModelGenerator;