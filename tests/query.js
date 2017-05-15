'use-strict';

let Query = require('../lib/query.js'),
  _ = require('lodash'),
  should = require('should'),
  index = 'test-index',
  type = 'test-type';

describe('Query', function () {

  describe('.parseQuery()', function () {
    it('MatchAll query when no queryOptions provided', function () {
      let query = Query.setMatchAllIfNoQuery({});
      query.should.have.property('match_all');
    });

    it('default Must query', function () {
      let req = Query.parseRequest(index, type, {name: 'Jim'});
      req.body.query.should.have.property('bool');
      req.body.query.bool.should.have.property('must', [{term: {name: 'Jim'}}]);
    });

    it('if matches argument is a string it transforms to QueryStringQuery', function () {
      let req = Query.parseRequest(index, type, 'Jim');
      req.should.have.property('body')
        .and.have.property('query', {query_string: {query: 'Jim'}});
    });

    it('Sort query', function () {
      let req = Query.parseRequest(index, type, null, {sort: 'createdOn'});
      req.body.should.have.property('sort');
    });

    it('Fields query', function () {
      let req = Query.parseRequest(index, type, null, {fields: ['name']});
      req.body.should.have.property('fields');
    });

    it('Paginate query', function () {
      let req = Query.parseRequest(index, type, null, {page: 1, per_page: 10});
      req.should.have.property('from', 0);
      req.should.have.property('size', 10);
    });

    // ES 5.x Filter are now within query
    it('Must Filter query', function () {
      let req = Query.parseRequest(index, type, null, {must: {name: 'Ford'}});
      req.body.query.should.have.property('bool')
        .and.have.property('must')
        .and.be.instanceof(Array);

      req.body.query.bool.must[0].should.have.property('term')
        .and.have.property('name', 'Ford');

      /*req.body.query.should.have.property('filtered')
       .and.have.property('filter')
       .and.have.property('bool')
       .and.have.property('must')
       .and.have.property('term')
       .and.have.property('name', 'Ford');*/
    });

    it('Must Filter query array', function () {
      let req = Query.parseRequest(index, type, null, {must: {name: 'Ford'}});
      Query.addTermFilters(req, {color: 'Red'});

      req.body.query.should.have.property('bool')
      //.and.have.property('bool')
        .and.have.property('must')
        .and.be.instanceof(Array);

      req.body.query.bool.must[0].should.have.property('term')
        .and.have.property('name', 'Ford');
      req.body.query.bool.must[1].should.have.property('term')
        .and.have.property('color', 'Red');
      /*
       req.body.query.should.have.property('filtered')
       .and.have.property('filter')
       .and.have.property('bool')
       .and.have.property('must')
       .and.be.instanceof(Array);
       req.body.query.filtered.filter.bool.must[0].should.have.property('term')
       .and.have.property('name', 'Ford');
       req.body.query.filtered.filter.bool.must[1].should.have.property('term')
       .and.have.property('color', 'Red');*/
    });

    it('Missing Filter query', function () {
      let req = Query.parseRequest(index, type, null, {missing: 'name'});
      req.body.should.have.property('query')

        .and.have.property('bool')
        .and.have.property('must_not')
        .and.be.instanceof(Array);

      req.body.query.bool.must_not[0].should.have.property('exists')
        .and.have.property('field', 'name');
    });

    it('Missing Filter query array', function () {
      let req = Query.parseRequest(index, type, null, {missing: ['name', 'color']});

      req.body.should.have.property('query')
        .and.have.property('bool')
        .and.have.property('must_not')
        .and.be.instanceof(Array);

      req.body.query.bool.must_not[0].should.have.property('exists')
        .and.have.property('field', 'name');
      req.body.query.bool.must_not[1].should.have.property('exists')
        .and.have.property('field', 'color');
    });

    it('Exists Filter query', function () {
      let req = Query.parseRequest(index, type, null, {exists: 'name'});
      req.body.should.have.property('query')
        .and.have.property('bool')
        .and.have.property('must')
        .and.be.instanceof(Array);

      req.body.query.bool.must[0].should.have.property('exists')
        .and.have.property('field', 'name');
    });

    it('Exists Filter query array', function () {
      let req = Query.parseRequest(index, type, null, {exists: ['name', 'color']});
      req.body.should.have.property('query')
        .and.have.property('bool')
        .and.have.property('must')
        .and.be.instanceof(Array);

      req.body.query.bool.must[0].should.have.property('exists')
        .and.have.property('field', 'name');
      req.body.query.bool.must[1].should.have.property('exists')
        .and.have.property('field', 'color');
    });

    it('Must Filter query with shorthand syntax', function () {
      let req = Query.parseRequest(index, type, {name: 'Ford', color: 'Blue'});

      req.body.query.should.have.property('bool');

    });
  });
});
