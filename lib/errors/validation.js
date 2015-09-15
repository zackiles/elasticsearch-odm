'use-strict';

var ElasticsearchError = require('../errors.js'),
    utils = require('../utils');

function ValidationError(instance, errors) {
  ElasticsearchError.call('Validation failed');
  this.stack = new Error().stack;
  this.name = 'ValidationError';
  this.errors = errors || [];
}

utils.inherits(ValidationError, ElasticsearchError);

ValidationError.prototype.toString = function () {
  var ret = this.name + ': ';
  var msgs = [];

  Object.keys(this.errors).forEach(function (key) {
    if (this == this.errors[key]) return;
    msgs.push(String(this.errors[key]));
  }, this);

  return ret + msgs.join(', ');
};

module.exports = ValidationError;
