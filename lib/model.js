'use strict';

var  _ = require('lodash'),
    Promise = require('bluebird');

function Model(document) {
  var self = this;
  _.assign(self, document);

  Object.defineProperty(self, 'isNew', {
    value: !document || !document.id,
    configurable: false,
    writable: true
  });
}

Model.prototype.execPreHook = function(name, context) {
  var self = this;
  return new Promise(function(resolve, reject){
    if(self.constructor.model.schema && self.constructor.model.schema.hooks){
      self.constructor.model.schema.hooks.execPre(name, context, function(err) {
        return err ? reject(err) : resolve();
      });
    }else{
      return resolve();
    }
  });
};

Model.prototype.execPostHook = function(name, context) {
  var self = this;
  if(self.constructor.model.schema && self.constructor.model.schema.hooks){
    self.constructor.model.schema.hooks.execPost(name, null, [context], function(){
      // null callback for post hooks, like mongoose.
    });
  }
  return void 0;
};

Model.prototype.validate = function(doc, partial) {
  if(this.constructor.model.schema){
    return this.constructor.model.schema.validate(doc, partial);
  }
};

Model.prototype.toObject = function() {
  return _.cloneDeep(this);
};

Model.prototype.toJSON = function() {
  return this.toObject();
};

Model.prototype.set = function(data, options) {
  var self = this;

  if(self.isNew){
    // User should be calling .save() insead, so redirect them.
    _.assign(self, data);
    return self.save();
  }

  var document = self.toObject();

  // Add any required keys to the new data.
  _.assign(data, {
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

  // Now we can assign the object to be sent.
  _.assign(document, data);

  return self.constructor.set(self.id, document, options)
  .then(function(result) {
    return _.assign(self, result);
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

    return self.constructor.create(document, options);
  })
  .then(function(result) {
    self.isNew = false;
    _.assign(self, result);
    self.execPostHook('save', self);
    return self;
  });
};

Model.prototype.update = function(data, options) {
  var self = this;

  // Schemas aren't requried, so check if it's defined.
  if(self.constructor.model.schema){
    var document = _.assign({}, self.toObject(), data);
    var errors = self.validate(document, true);
    if(errors) return Promise.reject(errors);
  }

  return self.constructor.update(self.id, data, options)
  .then(function(result) {
    self.isNew = false;
    return _.assign(self, result);
  });
};

Model.prototype.remove = function() {
  var self = this;
  return self.execPreHook('remove', self)
  .then(function(){
    return self.constructor.remove(self.id);
  })
  .then(function(){
    // don't pass instances to post remove hook, only Objects.
    // also make sure to pass the document before we remove it's id.
    self.execPostHook('remove', self.toObject());
    delete self.id;
    delete self._id;
    self.isNew = true;
    return self;
  });
};

module.exports = Model;
