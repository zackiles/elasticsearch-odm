'use-strict';

var ElasticsearchError = require('../errors.js'),
    utils = require('../utils');

function MissingArgumentError(path){
  ElasticsearchError.call(this, 'Missing argument "' + path + '".');
  if(Error.captureStackTrace) Error.captureStackTrace(this, arguments.callee);
  this.name = 'MissingArgumentError';
  this.path = path;
}

utils.inherits(MissingArgumentError, ElasticsearchError);

module.exports = MissingArgumentError;
