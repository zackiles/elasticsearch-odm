'use-strict';

var Schema = require('../lib/schema.js'),
    schemaMocks = require('./fixtures/schema-mocks'),
    _ = require('lodash'),
    should = require('should');

describe('Schema-Mappings', function(){

  it('returns an Elasticsearch properties mapping', function(){
    var schema = new Schema({
      name: String,
      company: {
        location: {type: String, required: true}
      },
      vendors: [{
        name: String,
        purchases: {
          name: String
        }
      }]
    });
    var mapping = schema.toMapping();
    mapping.should.have.property('properties')
      .and.have.property('name')
      .and.have.property('type', 'string');

    mapping.properties.should.have.property('vendors');

  });
});

/**
  A multi nested document query would look like this
 "query" : {
    "bool" : {
       "must" : [
          {
             "nested" : {
                "path" : "books",
                "query" : {
                   "match" : {
                      "books.title" : {
                         "abc"
                      }
                   }
                }
             }
          },
          "nested" : {
             "path" : "deals",
             "query" : {
                "match" : {
                   "deals.name" : {
                      "best"
                   }
                }
             }
          }
       ]
    }
 }
*/
