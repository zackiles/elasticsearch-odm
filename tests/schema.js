'use-strict';

var Schema = require('../lib/schema.js'),
    schemaMocks = require('./fixtures/schema-mocks'),
    _ = require('lodash'),
    should = require('should');

describe('Schema', function(){

  it('detects type definitions', function(){
    var schema = new Schema(schemaMocks.types);
    _.forOwn(schemaMocks.types, function(v, k){
      schema.fields.should.have.property(k)
        .and.have.property('type');
    });
  });

  it('ignores properties named type that are not type definitons', function(){
    var schema = new Schema(schemaMocks.typeAsType);
    schema.should.have.property('fields').and.have.property('type').and.have.property('type');
    schema.fields.type.should.have.property('options').and.have.property('required');
    schema.fields.should.have.property('nestedType').and.have.property('type');
    schema.fields.nestedType.type.should.have.property('options').and.have.property('required');
  });

  it('detects single level nested type definitions', function(){
    var schema = new Schema(schemaMocks.nestedSingleLevel);
    _.forOwn(schema.fields.nestedDocumentArray, function(v, k){
      if(k !=='type') v.should.have.property('type');
    });
    _.forOwn(schema.fields.nestedDocumentObject, function(v, k){
      if(k !=='type') v.should.have.property('type');
    });
  });

  it('validates a good document', function(){
    var schema = new Schema({
      name: String,
      createdOn: Date
    });
    var errors = schema.validate({name: 'Jim', createdOn: new Date().toISOString()});
    should.not.exist(errors);
  });

  it('validates a good document with properties named type that are not type definitons', function(){
    var schema = new Schema(schemaMocks.typeAsType);
    var errors = schema.validate({
      type: 'Something',
      nestedType: {
        type: 'Something'
      }
    });
    should.not.exist(errors);
  });

  it('returns errors for a bad document', function(){
    var schema = new Schema({
      name: String
    });
    var errors = schema.validate({name: 44});
    should.exist(errors);
  });

  it('returns errors for a bad document with properties named type that are not type definitons', function(){
    var schema = new Schema(schemaMocks.typeAsType);
    var errors = schema.validate({
      type: 235235235,
      nestedType: {
        type: 325235235
      }
    });
    should.exist(errors);
  });

  it('returns multiple errors for a bad document', function(){
    var schema = new Schema({
      name: String,
      age: Number
    });
    var errors = schema.validate({name: 44, age: '2343'});
    errors.should.be.an.instanceOf(Error)
      .and.has.property('errors')
      .and.has.property('length');
  });

  it('returns errors for a bad nested document', function(){
    var schema = new Schema({
      name: String,
      company: {
        location: String
      }
    });
    var errors = schema.validate({name: 'Bob', company:{location: 234}});
    errors.should.be.an.instanceOf(Error)
      .and.has.property('errors')
      .and.has.property('length');
  });

  it('returns errors for a missing required field', function(){
    var schema = new Schema({
      name: {type: String, required: true},
      age: Number
    });
    var errors = schema.validate({age: 44});
    errors.should.be.an.instanceOf(Error)
      .and.has.property('errors')
      .and.has.property('length');
  });

  it('returns an Elasticsearch properties mapping', function(){
    var schema = new Schema({
      name: String,
      company: {
        location: {type: String, required: true}
      }
    });
    var mapping = schema.toMapping();
    mapping.should.have.property('properties')
      .and.have.property('name')
      .and.have.property('type', 'string');
  });

});
