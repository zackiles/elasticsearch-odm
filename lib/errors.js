'use-strict';

var Promise = require('bluebird');

module.exports = {
  ElasticsearchError: ElasticsearchError,
  missingArgument: missingArgument,
  invalidSearchQuery: invalidSearchQuery,
  notConnected: notConnected
};

function ElasticsearchError(message){
  this.message = message;
  this.stack = new Error().stack;
  this.name = 'ElasticsearchError';
  this.prototype = Object.create(Error.prototype);
}

function missingArgument(propertyName, errorOnly){
  var message = 'Missing argument "' + propertyName + '".';
  var error = new ElasticsearchError(message);
  if(errorOnly){
    return error;
  }else{
    return Promise.reject(error);
  }
}

function invalidSearchQuery(message, errorOnly){
  var message = 'Invalid search query. ' + message;
  var error = new ElasticsearchError(message);
  if(errorOnly){
    return error;
  }else{
    return Promise.reject(error);
  }
}

function notConnected(){
  var message = 'Not connected to an Elasticsearch instance. Call connect() first.';
  return Promise.reject(new ElasticsearchError(message));
}
