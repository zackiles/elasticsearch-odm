'use strict';

var Query = require('./query'),
    _ = require('lodash'),
    logger = require('./logger'),
    Promise = require('bluebird');

function Model(document) {
  var self = this;
  _.extend(self, document);

  Object.defineProperty(self, 'isNew', {
    value: !document || !document.id,
    configurable: false,
    writable: true
  });
}

Model.prototype.execPreHook = function(name, context) {
  var self = this;
  return new Promise(function(resolve, reject){
    if(!self.constructor.model.schema || !self.constructor.model.schema.hooks) return resolve();
    self.constructor.model.schema.hooks.execPre(name, context, function(err) {
      return err ? reject(err) : resolve();
    });
  });
};

Model.prototype.execPostHook = function(name, context) {
  var self = this;
  return new Promise(function(resolve, reject){
    if(!self.constructor.model.schema || !self.constructor.model.schema.hooks) return resolve();
    self.constructor.model.schema.hooks.execPost(name, null, [context], function(err) {
      return err ? reject(err) : resolve();
    });
  });
};

Model.prototype.validate = function(doc, partial) {
  if(this.constructor.model.schema){
    return this.constructor.model.schema.validate(doc, partial);
  }
};

Model.prototype.toObject = function() {
  var obj = _.cloneDeep(this);
  return obj;
};

Model.prototype.toJSON = function() {
  return JSON.stringify(this.toObject());
};

Model.prototype.set = function(data, options) {
  var self = this;

  if(self.isNew){
    // User should be calling .save() insead, so redirect them.
    _.extend(self, data);
    return self.save();
  }

  var document = self.toObject();

  // Add any required keys to the new data.
  _.extend(data, {
    id: self.id,
    createdOn: self.createdOn,
    updatedOn: self.updatedOn,
  });

  // Find out any removed keys and delete them from current instance
  // and the document to be sent.
  var currentKeys = Object.keys(document);
  var newKeys = Object.keys(data);
  var deletedKeys = _.difference(currentKeys, newKeys);
  _.forEach(deletedKeys, function(k){
    delete self[k];
    delete document[k];
  });

  // Now we can extend the object to be sent.
  _.extend(document, data);

  return self.constructor.set(self.id, document, options)
  .then(function(result) {
    return _.extend(self, result);
  });
};

Model.prototype.save = function(options) {
  var self = this;

  if(!self.isNew){
    return self.update(self.toObject());
  }

  if(self.id){
    // If the user is trying to create a new model with a forced id,
    // then this only acts as an alias to the .set() function.
    return self.constructor.set(self.toObject(), options);
  }

  return self.execPreHook('save', self)
  .then(function(){
    var document = self.toObject();

    // Schemas aren't requried, so check if it's defined.
    if(self.constructor.model.schema){
      var errors = self.validate(document);
      if(errors) return Promise.reject(errors);
    }

    return self.constructor.create(document, options)
  })
  .then(function(result) {
    self.isNew = false;
    _.extend(self, result);
    return self.execPostHook('save', self);
  })
  .then(function(r) {
    return self;
  });
};

Model.prototype.update = function(data, options) {
  var self = this;

  // Schemas aren't requried, so check if it's defined.
  if(self.constructor.model.schema){
    var errors = self.validate(document, true);
    if(errors) return Promise.reject(errors);
  }

  return self.constructor.update(self.id, data, options)
  .then(function(result) {
    self.isNew = false;
    return _.extend(self, result);
  });
};

Model.prototype.remove = function() {
  var self = this;
  return self.execPreHook('remove', self)
  .then(function(){
    return self.constructor.remove(self.id);
  })
  .then(function(){
    return self.execPostHook('remove', self);
  })
  .then(function(){
    delete self.id;
    delete self._id;
    self.isNew = true;
    return self;
  });
};

module.exports = Model;
