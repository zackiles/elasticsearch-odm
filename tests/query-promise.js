'use-strict';

let requireNew = require('require-new'),
  app = requireNew('../index'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  should = require('should'),
  helper = require('./helper');

let Car = app.model('Car');
let car;

describe('Query-Promise', function () {

  before(function (done) {
    this.timeout(10000);
    helper.connect(app)
      .then(function () {
        car = new Car({name: 'Ford', slug: 'someslug'});
        return car.save();
      })
      .then(function () {
        // force index refresh
        return helper.refresh(app);
      })
      .then(function () {
        done();
      })
      .catch(done);
  });

  after(function (done) {
    this.timeout(10000);
    console.log("deleting");
    helper.remove(app)
      .then(function () {
        done();
      })
      .catch(done);
  });

  it('wraps a .find() query', function (done) {
    Car.find()
      .exists('name')
      .must({name: car.name, slug: car.slug})
      .missing('asfasfasf')
      .sort('createdOn')
      .then(function (res) {
        res.should.be.instanceof(Array);
        res.should.not.be.empty();
        res[0].should.have.property('name', car.name);
        res[0].should.have.property('slug', car.slug);
        done();
      })
      .catch(done);
  });

  it('can call .all() on array of query promises', function (done) {
    Promise.all([Car.findById(car.id), Car.findById(car.id)])
      .spread(function (promise1, promise2) {
        promise1.should.be.instanceof(Object).and.have.property('id', car.id);
        promise2.should.be.instanceof(Object).and.have.property('id', car.id);
        done();
      }).catch(done);
  });

});
