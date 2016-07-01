'use-strict';

var app = require('../index.js'),
  should = require('should'),
  Promise = require('bluebird'),
  _ = require('lodash');

var getUnique = function () {
  return _.uniqueId(Date.now().toString());
};

describe('Model-Consistency', function () {

  before(function (done) {
    this.timeout(10000);
    app
      .connect('esodm-test')
      .then(function () {
        done();
      })
      .catch(done);
  });

  after(function (done) {
    app
      .removeIndex('esodm-test')
      .then(function () {
        done();
      })
      .catch(done);
  });

  describe('model.remove()', function () {
    it('it removes documents consistently (create, save, remove)', function (done) {
      var promises = [];

      var makePromise = function () {
        var Model = app.model(getUnique());
        var instance;
        new Model({name: getUnique()})
          .save()
          .then(function (results) {
            instance = results.toObject();
            return results.remove();
          })
          .then(function () {
            return Model.findById(instance.id);
          })
          .then(function (results) {
            should.not.exist(results);
          })
          .catch(function () {
            return Promise.resolve();
          });
      };

      for (var i = 0; i < 100; i++) {
        promises.push(makePromise());
      }

      Promise
        .all(promises)
        .then(function(){
          done();
        });
    });
  });

  describe('model.update()', function () {
    it('it updates documents consistently (create, save, update)', function (done) {
      var promises = [];

      var makePromise = function () {
        var first;
        var newName = getUnique();
        var Model = app.model(getUnique());
        // create an object for this unique model
        new Model({name: getUnique()})
          .save()
          .then(function (results) {
            first = results.toObject();
            return results.update({name: newName});
          })
          .then(function (results) {
            if (results.name === newName) {
              first.name = newName;
              first.updatedOn = results.updatedOn;
              results = results.toObject();
              first.should.eql(results);
            } else {
              return Promise.reject(new Error('Update not consistent'));
            }
            return Model.removeByIds([first.id, results.id]);
          });
      };

      for (var i = 0; i < 100; i++) {
        promises.push(makePromise());
      }

      Promise
        .all(promises)
        .then(function(){
          done();
        });
    });
  });

});
