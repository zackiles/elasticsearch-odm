'use-strict';

var app = require('../index'),
    _ = require('lodash'),
    Promise = require('bluebird'),
    should = require('should');

var Model = app.model('Jump');

describe('Query-Advanced', function(){
  // some of the calls use refresh, it is slow.
  this.timeout(20000);

  before(function(done){
    app.connect('esodm-test')
    .then(function(){
      done();
    })
    .catch(done);
  });


  describe('Filters', function(){
    var self = this;
    before(function(done){
      Model.create({
        name: Date.now().toString(),
        slug: Date.now().toString(),
        keys: ['a', 'b']
      }, {refresh: true})
      .then(function(doc){
        self.doc = doc;
        done();
      })
      .catch(done);
    });

    it('multi must', function(done){
      Model.find({name: self.doc.name, slug: self.doc.slug})
      .then(function(res){
        res.should.be.instanceof(Array);
        res[0].should.have.property('name', self.doc.name);
        res[0].should.have.property('slug', self.doc.slug);
        done();
      }).catch(done);
    });

    it('must field values can be an array', function(done){
      Model.find({keys: self.doc.keys})
      .then(function(res){
        res.should.be.instanceof(Array);
        res[0].should.have.property('keys', self.doc.keys);
        done();
      }).catch(done);
    });

    it('Paged queries return an empty PagedResult when no results are found', function(done){
      Model.find({fasfasf: 'asfasfasfasf'}, {page: 1, per_page: 2})
      .then(function(res){
        res.should.have.property('total', 0);
        res.should.have.property('pages', 0);
        res.should.have.property('page', 1);
        res.should.have.property('hits', []);
        done();
      }).catch(done);
    });

  });
});
