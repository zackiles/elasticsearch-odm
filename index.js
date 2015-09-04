'use strict';

var logger = require('./lib/logger'),
    Client = require('./lib/client'),
    Schema = require('./lib/schema'),
    errors = require('./lib/errors'),
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
  loggingEnabled: process.env.NODE_ENV === 'development',
  index: '',
  client: {}
};
var models = {};

function connect(options){
  if(isConnected()) return status(db.index);

  if(_.isEmpty(options)) return Promise.reject(new MissingArgumentError('options'));

  // can pass just the index name, or a client configuration object.
  if(_.isString(options)){
    db.index = options;
  }else if(_.isObject(options)){
    if(!options.index) return Promise.reject(new MissingArgumentError('options.index'));
    db = _.merge(db, options);
  }else{
    return Promise.reject(new MissingArgumentError('options'));
  }

  db.client = new Client(db);

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

  models[db.index] = models[db.index] || {};

  if(models[db.index] && models[db.index][modelName]){

    // don't overwrite schemas on secondary calls.
    if(schema && _.isEmpty(models[db.index].model.schema)){
      models[db.index].model.schema = schema;
    }

    // return model from cache if it exists.
    return models[db.index][modelName];
  }

  function modelInstance(data){
    Model.call(this, data);
  }

  // return a neweable function object
  utils.inherits(modelInstance, Model);

  // add crud/query static functions
  _.extend(modelInstance, defaultMethods);

  modelInstance.db = db;

  modelInstance.model = {
    type: modelName,
    name: modelName,
    constructor: modelInstance
  };
  if(schema) modelInstance.model.schema = schema;

  models[db.index][modelName] = modelInstance;
  return models[db.index][modelName];
}

module.exports = {
  client: db.client,
  connect: connect,
  isConnected: isConnected,
  status: status,
  removeIndex: removeIndex,
  createIndex: createIndex,
  model: model,
  Schema: Schema
};
