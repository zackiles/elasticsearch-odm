'use-strict';

let requireNew = require('require-new'),
  app = requireNew('../index.js'),
  _ = require('lodash'),
  should = require('should');

let schema = new app.Schema({
  name: 'text'
});

schema.methods.instanceMethod = function () {
  return this;
};
schema.statics.staticMethod = function () {
  return this;
};

let Model = app.model('SchemaMethods', schema);
let nameValue = Date.now().toString();
let model = new Model({name: nameValue});

describe('Schema-Methods', function () {

  it('Adds instance methods', function () {
    model.should.have.property('instanceMethod').and.be.type('function');
    model.instanceMethod().should.have.property('name', nameValue);
  });

  it('Adds static methods', function () {
    Model.should.have.property('staticMethod').and.be.type('function');
    Model.staticMethod().should.have.property('find').and.be.type('function');
  });
});
