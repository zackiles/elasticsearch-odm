'use strict';

var Query = require('./query'),
    _ = require('lodash'),
    logger = require('./logger'),
    Promise = require('bluebird'),
    errors = require('./errors'),
    util = require('util');

module.exports = Model;

function Model(document) {
  var self = this;
  _.forIn(document, function(v, k){
    self[k] = v;
  });
  if(document && document.id){
    self.isNew = false;
    self.isInstance = true;
  }
}

Model.prototype.__internal = {};

Model.prototype.isNew = true;
Model.prototype.isInstance = false;

Model.prototype.toObject = function() {
  return _.cloneDeep(this);
};

Model.prototype.toJSON = function() {
  return JSON.stringify(this.toObject());
};

Model.prototype.save = function(document) {
  var self = this;
  document = document || self.toObject();

  if(!self.isNew){
    return self.update(document);
  }

  if(document.id){
    // if the user is trying to create a new model with a forced id,
    // then this only acts as an alias to the .set() function.
    return self.__internal.constructor.set(document.id, document);
  }

  return self.__internal.constructor.create(document)
  .then(function(result) {
    return self = _.assign(self, result);
  });
};

Model.prototype.update = function(data) {
  var self = this;

  return self.__internal.constructor.update(self.id, data)
  .then(function(result) {
    return self = _.assign(self, result);
  });
};

Model.prototype.remove = function() {
  var self = this;

  return self.__internal.constructor.remove(self.id)
  .then(function(){
    delete self.id;
    delete self._id;
    self.isNew = true;
    self.isInstance = false;
    return void 0;
  });
};
