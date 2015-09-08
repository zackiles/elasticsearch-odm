'use-strict';

var app = require('../index'),
    _ = require('lodash'),
    should = require('should');

var Car = app.model('Car');
var car;

describe('Query Promise', function(){
  before(function(done){
    this.timeout(10000);
    app.connect('esodm-test').then(function(){
      car = new Car({name:'Ford'});
      return car.save();
    })
    .then(function(){
      done();
    })
    .catch(done);
  });

  it('wraps a .find() query', function(done){
    Car.find({name: car.name})
    .sort('createdOn')
    .then(function(res){
      res.should.be.instanceof(Array);
      res[0].should.have.property('name', car.name);
      done();
    });
  });

  after(function(done){
    this.timeout(10000);
    Car.findAndRemove({name: car.name})
    .then(function(results){

      done();
    })
    .catch(done);
  });
});
