'use strict';

var logger = require('./lib/logger'),
    Client = require('./lib/client'),
    errors = require('./lib/errors'),
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
    },
    models = {};

function connect(options){
  if(isConnected()) return status(db.index);

  if(_.isEmpty(options)) return errors.missingArgument('options');

  // can pass just the index name, or a client configuration object.
  if(_.isString(options)){
    db.index = options;
  }else if(_.isObject(options)){
    if(!options.index) return errors.missingArgument('options.index');
    db = _.merge(db, options);
  }else{
    return errors.missingArgument('options');
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
  if(!isConnected()) return errors.notConnected();

  var args = {index: db.index};
  if(type) args.type = type;
  return db.client.indices.status(args);
}

function createIndex(index, mappings){
  if(!index) return errors.missingArgument('index');
  if(!isConnected()) return errors.notConnected();

  return db.client.indices.create({
    index: index,
    body: mappings || defaultMappings
  });
}

function removeIndex(index){
  if(!index) return errors.missingArgument('index');
  if(!isConnected()) return errors.notConnected();

  return db.client.indices.delete({index: index}).catch(function(){});
}

function model(type){
  if(!type) return errors.missingArgument('type');

  models[db.index] = models[db.index] || {};

  if(models[db.index] && models[db.index][type]){
    // return model from cache if it exists.
    return models[db.index][type];
  }

  function modelInstance(data){
    Model.call(this, data);
  }

  _.extend(modelInstance, defaultMethods);

  modelInstance.prototype = Object.create(Model.prototype);
  modelInstance.db = modelInstance.prototype.db = db;
  modelInstance.prototype.constructor = models[db.index][type] = modelInstance;
  modelInstance.__internal = modelInstance.prototype.__internal = {
    type: type,
    constructor: modelInstance
  };
  return models[db.index][type];
}

module.exports = {
  client: db.client,
  connect: connect,
  isConnected: isConnected,
  status: status,
  removeIndex: removeIndex,
  createIndex: createIndex,
  model: model
};
