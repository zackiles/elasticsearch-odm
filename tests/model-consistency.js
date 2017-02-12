'use-strict';

let requireNew = require('require-new'),
  app = requireNew('../index.js'),
  should = require('should'),
  Promise = require('bluebird'),
  _ = require('lodash'),
  helper = require('./helper');

let getUnique = function () {
  return _.uniqueId(Date.now().toString());
};

describe('Model-Consistency', function () {
  this.timeout(20000);

  before(function (done) {
    this.timeout(10000);
    helper.connect(app)
      .then(function () {
        done();
      })
      .catch(done);
  });

  after(function (done) {
    this.timeout(10000);
    helper.remove(app)
      .then(function () {
        done();
      })
      .catch(done);
  });

  describe('model.remove()', function () {
    it('it removes documents consistently (create, save, remove)', function (done) {
      let promises = [];

      let makePromise = function () {
        return new Promise(function (success, error) {
          let Model = app.model(getUnique());
          let instance;
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
              success();
            })
            .catch(function (err) {
              if (err.displayName == 'NotFound') {
                success();
              } else {
                error(err);
              }
            });
        });
      };

      for (let i = 0; i < 50; i++) {
        promises.push(makePromise());
      }

      Promise
        .all(promises)
        .then(function () {
          done();
        })
        .catch(done);
    });
  });

  describe('model.update()', function () {
    it('it updates documents consistently (create, save, update)', function (done) {
      let promises = [];

      let makePromise = function () {
        return new Promise(function (success, error) {
          let first;
          let newName = getUnique();
          let Model = app.model(getUnique());
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
                error(new Error('Update not consistent'));
              }

              return Model.removeByIds([first.id, results.id]);
            })
            .then(function () {
              success();
            });
        });
      };

      for (let i = 0; i < 50; i++) {
        promises.push(makePromise());
      }

      Promise
        .all(promises)
        .then(function () {
          done();
        })
        .catch(done);
    });
  });

});
