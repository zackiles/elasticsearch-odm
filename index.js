'use strict';

var logger = require('./lib/logger'),
    Client = require('./lib/client'),
    Schema = require('./lib/schema'),
    errors = require('./lib/errors'),
    pluralize = require('pluralize'),
    utils = require('./lib/utils'),
    MissingArgumentError = errors.MissingArgumentError,
    ConnectionError = errors.ConnectionErrorr,
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

function connect(options){
  if(isConnected()) return status(db.index);

  // can pass just the index name, or a client configuration object.
  if(_.isString(options)){
    db.index = options;
  }else if(_.isObject(options)){
    if(!options.index) return Promise.reject(new MissingArgumentError('options.index'));
    db = _.extend(db, options);
  }else{
    return Promise.reject(new MissingArgumentError('options'));
  }

  db.client = Client.makeClient(db);

  return db.client.indices.exists({index: db.index}).then(function(result){
    if(result){
      return status(db.index);
    }else{
      // if the index doesn't exist, then create it.
      return createIndex(db.index).then(function(){
        return status(db.index);
      });
    }
  });
}

function isConnected(){
  return _.isEmpty(db.client) === false;
}

function status(type){
  if(!isConnected()) return Promise.reject(new ConnectionError(db.index));

  var args = {index: db.index};
  if(type) args.type = type;
  return db.client.indices.status(args);
}

function createIndex(index, mappings){
  if(!index) return Promise.reject(new MissingArgumentError('index'));
  if(!isConnected()) return errors.notConnected();

  return db.client.indices.create({
    index: index,
    body: mappings || defaultMappings
  });
}

function removeIndex(index){
  if(!index) return Promise.reject(new MissingArgumentError('index'));
  if(!isConnected()) return errors.notConnected();

  return db.client.indices.delete({index: index}).catch(function(){});
}

function model(modelName, schema){
  if(!modelName) return Promise.reject(new MissingArgumentError('modelName'));
  if(schema && !(schema instanceof Schema)) return Promise.reject(new errors.ElasticsearchError('Invalid schema for "'+modelName+'".'));

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
    Model.call(this, data);
  }
  utils.inherits(modelInstance, Model);

  // add crud/query static functions.
  _.extend(modelInstance, defaultMethods);

  modelInstance.db = db;

  modelInstance.model = {
    type: pluralize(modelName).toLowerCase(),
    name: modelName,
    constructor: modelInstance,
    isMappingSynced: false
  };

  if(schema) {
    modelInstance.model.schema = schema;

    // user can provide their own type name, default is pluralized.
    if(schema.options.type) modelInstance.model.type = schema.options.type;
  }

  db.models[modelName] = modelInstance;
  return db.models[modelName];
}

function stats(){
  if(!isConnected()) return errors.notConnected();
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
