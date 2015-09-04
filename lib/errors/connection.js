'use-strict';

var ElasticsearchError = require('../errors.js'),
    utils = require('../utils');

function ConnectionError(host){
  var message;
  if(host){
    message = 'No connection can be established to Elasticsearch at ' + host;
  }else{
    message = 'No connection has been established to Elasticsearch.';
  }
  ElasticsearchError.call(this, message);
  if(Error.captureStackTrace) Error.captureStackTrace(this, arguments.callee);
  this.name = 'ConnectionError';
  this.host = host || '';
}

utils.inherits(ConnectionError, ElasticsearchError);

module.exports = ConnectionError;
