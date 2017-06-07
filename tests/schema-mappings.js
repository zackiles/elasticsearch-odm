'use-strict';

let Schema = require('../lib/schema.js'),
  _ = require('lodash'),
  should = require('should');

describe('Schema-Mappings', function () {

  it('returns an Elasticsearch properties mapping', function () {
    let schema = new Schema({
      name: 'text',
      company: {
        location: {type: 'text', required: true}
      },
      vendors: [{
        name: 'text',
        purchases: {
          name: 'text'
        }
      }]
    });
    let mapping = schema.toMapping();
    mapping.should.have.property('properties')
      .and.have.property('name')
      .and.have.property('type', 'text');

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
