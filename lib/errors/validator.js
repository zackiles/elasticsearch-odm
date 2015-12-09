'use-strict';

var ElasticsearchError = require('../errors.js'),
    utils = require('../utils');

function ValidatortError(property, reason){
  var message = "Validator failed for property '"+ property + "'";
  if(reason) message = message + " " + reason;

  ElasticsearchError.call(this, message);
  if(Error.captureStackTrace) Error.captureStackTrace(this, arguments.callee);
  this.name = 'ValidatorError';
  this.property = property;
}

utils.inherits(ValidatortError, ElasticsearchError);

module.exports = ValidatortError;
