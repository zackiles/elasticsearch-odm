'use strict';

var Query = require('./query'),
    _ = require('lodash'),
    logger = require('./logger'),
    Promise = require('bluebird');

function Model(document) {
  var self = this;
  _.extend(self, document);

  if(document && document.id){
    self.isNew = false;
  }else{
    self.isNew = true;
  }
}

Model.prototype.validate = function(doc, partial) {
  if(this.constructor.model.schema){
    return this.constructor.model.schema.validate(doc, partial);
  }
};

Model.prototype.toObject = function() {
  return _.cloneDeep(this);
};

Model.prototype.toJSON = function() {
  return JSON.stringify(this.toObject());
};

Model.prototype.save = function() {
  var self = this;
  var document = self.toObject();

  if(!self.isNew){
    return self.update(document);
  }

  // schemas aren't requried, so check if it's defined.
  if(self.constructor.model.schema){
    var errors = self.validate(document);
    if(errors) return Promise.reject(errors);
  }

  if(document.id){
    // if the user is trying to create a new model with a forced id,
    // then this only acts as an alias to the .set() function.
    return self.constructor.set(document.id, document);
  }

  return self.constructor.create(document)
  .then(function(result) {
    return _.assign(self, result);
  });
};

Model.prototype.update = function(data) {
  var self = this;

  // schemas aren't requried, so check if it's defined.
  if(self.constructor.model.schema){
    var errors = self.validate(document, true);
    if(errors) return Promise.reject(errors);
  }

  return self.constructor.update(self.id, data)
  .then(function(result) {
    return _.assign(self, result);
  });
};

Model.prototype.remove = function() {
  var self = this;

  return self.constructor.remove(self.id)
  .then(function(){
    delete self.id;
    delete self._id;
    self.isNew = true;
    return void 0;
  });
};

module.exports = Model;
