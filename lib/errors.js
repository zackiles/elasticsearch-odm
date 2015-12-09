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

ElasticsearchError.ConnectionError = require('./errors/connection');
ElasticsearchError.ValidatorError = require('./errors/validator');
ElasticsearchError.ValidationError = require('./errors/validation');
ElasticsearchError.MissingArgumentError = require('./errors/missing-argument');
