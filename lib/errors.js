'use-strict';

var Promise = require('bluebird'),
    utils = require('./utils');

function ElasticsearchError(message){
  this.message = message;
  this.stack = new Error().stack;
  this.name = 'ElasticsearchError';
}

utils.inherits(ElasticsearchError, Error);

module.exports = exports = ElasticsearchError;

ElasticsearchError.ElasticsearchError = require('./errors/connection');
ElasticsearchError.ValidationtError = require('./errors/validation');
ElasticsearchError.MissingArgumentError = require('./errors/missing-argument');
