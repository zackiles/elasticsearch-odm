'use-strict';

var Query = require('../lib/query.js'),
    _ = require('lodash'),
    should = require('should'),
    index = 'test-index',
    type = 'test-type';

describe('Query', function(){


  describe('.parseQuery()', function(){
    it('creates a MatchAll query when no queryOptions provided', function(){
      var req = Query.parseRequest(index, type);
      req.should.have.property('index', index);
      req.should.have.property('type', type);
      req.should.have.property('body')
        .and.have.property('query', { match_all: {} });
    });

    it('creates a default Must query', function(){
      var req = Query.parseRequest(index, type, {name: 'Jim'});
      req.body.query.should.have.property('filtered');
    });

    it('nested Must/Not queries are flattened to dot-notation', function(){
      var req = Query.parseRequest(index, type, null, {must: {
        comments: {
          username: 'Jim'
        }
      }});
      req.should.have.property('body')
        .and.have.property('query')
        .and.have.property('filtered')
        .and.have.property('filter')
        .and.have.property('bool')
        .and.have.property('must')
        .and.have.property('term')
        .and.have.property('comments.username', 'Jim');
    });

    it('if matches argument is a string it transforms to QueryStringQuery', function(){
      var req = Query.parseRequest(index, type, 'Jim');
      req.should.have.property('body')
        .and.have.property('query', { query_string: { query: 'Jim' } });
    });

    it('creates a Random query', function(){
      var req = Query.parseRequest(index, type, null, {random: true});
      req.body.query.should.have.property('function_score')
        .and.have.property('random_score')
        .and.have.property('seed');
    });

    it('creates a Sort query', function(){
      var req = Query.parseRequest(index, type, null, {sort: 'createdOn'});
      req.body.should.have.property('sort');
    });

    it('creates a Fields query', function(){
      var req = Query.parseRequest(index, type, null, {fields: ['name']});
      req.body.should.have.property('fields');
    });

    it('creates a Paginate query', function(){
      var req = Query.parseRequest(index, type, null, {page: 1, per_page: 10});
      req.should.have.property('from', 0);
      req.should.have.property('size', 10);
    });

    it('creates a Must Filter query', function(){
      var req = Query.parseRequest(index, type, null, {must: {name: 'Ford', color: 'Blue'}} );
      req.body.query.should.have.property('filtered');
    });

    it('creates a Missing Filter query', function(){
      var req = Query.parseRequest(index, type, null, {missing: ['published']} );
      req.body.query.should.have.property('filtered');
    });

    it('creates a Must Filter query with shorthand syntax', function(){
      var req = Query.parseRequest(index, type, {name: 'Ford', color: 'Blue'});
      req.body.query.should.have.property('filtered');
    });
  });
});
