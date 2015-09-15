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
        slug: Date.now().toString()
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
      })
    });
  });
});
