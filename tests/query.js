'use-strict';

var Query = require('../lib/query.js'),
    _ = require('lodash'),
    index = 'test-index',
    type = 'test-type';

describe('Query', function(){


  describe('.parseQuery()', function(){
    it('it creates a MatchAll query when no queryOptions provided', function(done){
      var req = Query.parseRequest(index, type);
      req.should.have.property('index', index);
      req.should.have.property('type', type);
      req.should.have.property('body');
      req.body.should.have.property('query', { match_all: {} });
      done();
    });
    it('it creates a default Must query', function(done){
      var req = Query.parseRequest(index, type, {name: 'Jim'});
      req.body.query.should.have.property('filtered');
      done();
    });
    it('it creates a Random query', function(done){
      var req = Query.parseRequest(index, type, null, {random: true});
      req.body.query.should.have.property('function_score');
      req.body.query.function_score.should.have.property('random_score');
      req.body.query.function_score.random_score.should.have.property('seed');
      done();
    });
    it('it creates a Sort query', function(done){
      var req = Query.parseRequest(index, type, null, {sort: 'createdOn'});
      req.body.should.have.property('sort');
      done();
    });
    it('it creates a Fields query', function(done){
      var req = Query.parseRequest(index, type, null, {fields: ['name']});
      req.body.should.have.property('fields');
      done();
    });
    it('it creates a Paginate query', function(done){
      var req = Query.parseRequest(index, type, null, {page: 1, per_page: 10});
      req.should.have.property('from', 0);
      req.should.have.property('size', 10);
      done();
    });
    it('it creates a Must Filter query', function(done){
      var req = Query.parseRequest(index, type, null, {must: {name: 'Ford', color: 'Blue'}} );
      req.body.query.should.have.property('filtered');
      done();
    });
    it('it creates a Must Filter query with shorthand syntax', function(done){
      var req = Query.parseRequest(index, type, {name: 'Ford', color: 'Blue'});
      req.body.query.should.have.property('filtered');
      done();
    });
  });
});
