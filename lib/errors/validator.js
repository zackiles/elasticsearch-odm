'use-strict';

let ElasticsearchError = require('../errors.js'),
    utils = require('../utils');

function ValidatortError(property, reason){
  let message = "Validator failed for property '"+ property + "'";
  if(reason) message = message + " " + reason;

  ElasticsearchError.call(this, message);
  if(Error.captureStackTrace) Error.captureStackTrace(this, arguments.callee);
  this.name = 'ValidatortError';
  this.property = property;
}

utils.inherits(ValidatortError, ElasticsearchError);

module.exports = ValidatortError;
