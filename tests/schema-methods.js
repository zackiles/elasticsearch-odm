'use-strict';

var app = require('../index.js'),
    _ = require('lodash'),
    should = require('should');

var schema = new app.Schema({
  name: String
});

schema.methods.instanceMethod = function(){
  return this;
};
schema.statics.staticMethod = function(){
  return this;
};


var Model = app.model('SchemaMethods', schema);
var nameValue = Date.now().toString();
var model = new Model({name: nameValue});

describe('Schema-Methods', function(){

  it('Adds instance methods', function(){
    model.should.have.property('instanceMethod').and.be.type('function');
    model.instanceMethod().should.have.property('name', nameValue);
  });

  it('Adds static methods', function(){
    Model.should.have.property('staticMethod').and.be.type('function');
    Model.staticMethod().should.have.property('find').and.be.type('function');
  });
});
