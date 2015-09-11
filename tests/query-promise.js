'use-strict';

var app = require('../index'),
    _ = require('lodash'),
    Promise = require('bluebird'),
    should = require('should');

var Car = app.model('Car');
var car;

describe('Query-Promise', function(){
  before(function(done){
    this.timeout(10000);
    app.connect('esodm-test')
    .then(function(){
      car = new Car({name:'Ford', slug: 'someslug'});
      return car.save();
    })
    .then(function(){
      done();
    })
    .catch(done);
  });

  it('wraps a .find() query', function(done){
    Car.find()
    .sort('createdOn')
    .missing('asfasfasf')
    .exists('name')
    .must({name: car.name, slug: car.slug})
    .then(function(res){
      res.should.be.instanceof(Array);
      res[0].should.have.property('name', car.name);
      res[0].should.have.property('slug', car.slug);
      done();
    })
    .catch(done);
  });

  it('can call .all() on array of query promises', function(done){
    Promise.all([Car.findById(car.id), Car.findById(car.id)])
    .spread(function(promise1, promise2){
      promise1.should.be.instanceof(Object).and.have.property('id', car.id);
      promise2.should.be.instanceof(Object).and.have.property('id', car.id);
      done();
    }).catch(done);
  });

  after(function(done){
    this.timeout(10000);
    Car.findAndRemove({name: car.name})
    .then(function(){
      done();
    })
    .catch(done);
  });
});
