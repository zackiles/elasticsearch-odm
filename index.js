'use strict';

var logger = require('./lib/logger'),
    Client = require('./lib/client'),
    Schema = require('./lib/schema'),
    errors = require('./lib/errors'),
    pluralize = require('pluralize'),
    utils = require('./lib/utils'),
    MissingArgumentError = errors.MissingArgumentError,
    ConnectionError = errors.ConnectionError,
    Model = require('./lib/model'),
    defaultMethods = require('./lib/default-methods'),
    defaultMappings = require('./default-mappings'),
    _ = require('lodash'),
    Promise = require('bluebird');

logger.transports.console.silent = (process.env.NODE_ENV !== 'development');

var db = {
  host: 'localhost:9200',
  index: '',
  logging: process.env.NODE_ENV === 'development',
  client: {},
  models: {}
};

var CONNECTED = false;

var mappingQueue = [];
var syncMapping = true;
var handleMappingQueue = function(){
  if(!mappingQueue.length || syncMapping == false) return Promise.resolve();
  return Promise.map(mappingQueue , function(v){
    return db.client.indices.putMapping({
      index: db.index,
      type: v.type,
      ignore_conflicts: true,
      body:v.mapping
    });
  });
};

function connect(options){
  if(isConnected()) return Promise.resolve();

  // can pass just the index name, or a client configuration object.
  if(_.isString(options)){
    db.index = options;
  }else if(_.isObject(options)){
    if(!options.index) return Promise.reject(new MissingArgumentError('options.index'));
    if(options.hasOwnProperty('syncMapping')){
      syncMapping = options.syncMapping;
      delete options.syncMapping;
    }
    db = _.assign(db, options);
  }else{
    return Promise.reject(new MissingArgumentError('options'));
  }

  module.exports.client = db.client = Client.makeClient(db);

  return db.client.indices.exists({index: db.index}).then(function(result){
    //No error - connected
    CONNECTED = true;

    if(result){
      return handleMappingQueue();
    }else{
      // if the index doesn't exist, then create it.
      return createIndex(db.index).then(handleMappingQueue);
    }
  })
  .then(function(results){
    return Promise.resolve();
  });
}

function isConnected(){
  return CONNECTED;
}

function status(type){
  if(!isConnected()) return Promise.reject(new ConnectionError(db.host));

  var args = {index: db.index};
  if(type) args.type = type;
  return db.client.indices.status(args);
}

function createIndex(index, mappings){
  if(!index) return Promise.reject(new MissingArgumentError('index'));
  if(!isConnected()) return Promise.reject(new ConnectionError(db.host));

  return db.client.indices.create({
    index: index,
    body: mappings || defaultMappings
  });
}

function removeIndex(index){
  if(!index) return Promise.reject(new MissingArgumentError('index'));
  if(!isConnected()) return Promise.reject(new ConnectionError(db.host));

  return db.client.indices.delete({index: index}).catch(function(){});
}

function model(modelName, schema){
  if(!modelName) throw new MissingArgumentError('modelName');
  if(schema && !(schema instanceof Schema)) throw new errors.ElasticsearchError('Invalid schema for "'+modelName+'".');

  if(db.models[modelName]){

    // don't overwrite schemas on secondary calls.
    if(schema && _.isEmpty(db.models[modelName].model.schema)){
      db.models[modelName].model.schema = schema;
    }

    // return model from cache if it exists.
    return db.models[modelName];
  }

  // create a neweable function object.
  function modelInstance(data){
    var self = this;
    // Add any user supplied schema instance methods.
    if(schema){
      _.assign(self, schema.methods);
    }
    Model.call(self, data);
  }
  utils.inherits(modelInstance, Model);

  // add crud/query static functions.
  _.assign(modelInstance, defaultMethods);

  modelInstance.db = db;

  modelInstance.model = {
    type: pluralize(modelName).toLowerCase(),
    name: modelName,
    constructor: modelInstance
  };

  if(schema) {
    modelInstance.model.schema = schema;
    // Add any user supplied schema static methods.
    _.assign(modelInstance, schema.statics);

    // User can provide their own type name, default is pluralized.
    if(schema.options.type) modelInstance.model.type = schema.options.type;

    // Update the mapping asynchronously.
    var mapping = {};
    mapping[modelInstance.model.type] = schema.toMapping();
    mappingQueue.push({type: modelInstance.model.type, mapping: mapping});
    // If we're already connected process the mapping queue.
    if(isConnected()){
      handleMappingQueue();
    }
  }

  return db.models[modelName] = modelInstance;
}

function stats(){
  if(!isConnected()) return Promise.reject(new ConnectionError(db.host));
  return db.client.indices.stats({index:db.index});
}

module.exports = {
  client: db.client,
  connect: connect,
  isConnected: isConnected,
  status: status,
  stats: stats,
  removeIndex: removeIndex,
  createIndex: createIndex,
  model: model,
  Schema: Schema
};
