'use-strict';

var ElasticsearchError = require('../errors.js'),
    utils = require('../utils');

function ValidationtError(instance, property, reason){
  var message;

  if(instance && instance.model && instance.model.name){
    message = 'Validation failed for model "' + instance.model.name + '" for property "' + property + '".';
  }else{
    message = 'Validation failed for property "' + property + '".';
  }

  if(reason) message += ' ' + reason;
  ElasticsearchError.call(this, message);
  if(Error.captureStackTrace) Error.captureStackTrace(this, arguments.callee);
  this.name = 'ValidationtError';
  this.property = property;
}

utils.inherits(ValidationtError, ElasticsearchError);

module.exports = ValidationtError;
