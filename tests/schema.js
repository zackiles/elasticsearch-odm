'use-strict';

var Schema = require('../lib/schema.js'),
    schemaMocks = require('./fixtures/schema-mocks'),
    _ = require('lodash'),
    should = require('should');

describe('Schema', function(){

  it('detects type definitions', function(done){
    var schema = new Schema(schemaMocks.types);
    _.forOwn(schemaMocks.types, function(v, k){
      schema.fields.should.have.property(k)
        .and.have.property('type');
    });
    done();
  });

  it('detects single level nested type definitions', function(done){
    var schema = new Schema(schemaMocks.nestedSingleLevel);
    _.forOwn(schema.fields.nestedDocumentArray, function(v, k){
      if(k !=='type') v.should.have.property('type');
    });
    _.forOwn(schema.fields.nestedDocumentObject, function(v, k){
      if(k !=='type') v.should.have.property('type');
    });
    done();
  });

  it('validates a valid document', function(done){
    var schema = new Schema({
      name: String,
      createdOn: Date
    });
    var errors = schema.validate({name: 'Jim', createdOn: new Date().toISOString()});
    should.not.exist(errors);
    done();
  });

  it('returns errors for a bad document', function(done){
    var schema = new Schema({
      name: String
    });
    var errors = schema.validate({name: 44});
    should.exist(errors);
    done();
  });

  it('returns multiple errors for a bad document', function(done){
    var schema = new Schema({
      name: String,
      age: Number
    });
    var errors = schema.validate({name: 44, age: '2343'});
    errors.should.be.an.instanceOf(Array).with.lengthOf(2);
    done();
  });

  it('returns errors for a bad nested document', function(done){
    var schema = new Schema({
      name: String,
      company: {
        location: String
      }
    });
    var errors = schema.validate({name: 'Bob', company:{location: 234}});
    errors.should.be.an.instanceOf(Array).with.lengthOf(1);
    done();
  });

  it('returns errors for a missing required field', function(done){
    var schema = new Schema({
      name: {type: String, required: true},
      age: Number
    });
    var errors = schema.validate({age: 44});
    errors.should.be.an.instanceOf(Array).with.lengthOf(1);
    done();
  });

  it('generates an Elasticsearch properties mapping', function(done){
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
    done();
  });

});
