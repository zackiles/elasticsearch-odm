'use-strict';

const requireNew = require('require-new'),
  should = require('should'),
  helper = require('./helper');

describe('Connection', function () {
  this.timeout(5000);

  describe('connect and disconnect properly', function () {

    it('connect', function (done) {
      let app = requireNew('../index');
      should.equal(app.isConnected(), false);
      helper.connect(app)
        .then(function () {
          should.equal(app.isConnected(), true);
        })
        .then(function () {
          return helper.remove(app);
        })
        .then(function () {
          done();
        })
        .catch(done);
    });

    it('connect with custom settings', function (done) {
      let app = requireNew('../index');
      should.equal(app.isConnected(), false);
      helper.connect(app, 1)
        .then(function () {
          should.equal(app.isConnected(), true);
        })
        .then(function () {
          console.log("require settings");
          return helper.getSettings(app);
        })
        .then(function (settings) {
          console.log("check shards");
          should.equal(settings['index.number_of_shards'], 1);
        })
        .then(function () {
          console.log("remove");
          return helper.remove(app);
        })
        .then(function () {
          done();
        })
        .catch(done);
    });

    it('disconnect', function (done) {
      let app = requireNew('../index');
      let indexName;
      should.equal(app.isConnected(), false);
      helper.connect(app)
        .then(function () {
          should.equal(app.isConnected(), true);
          indexName = app.index;
        })
        .then(function () {
          return app.disconnect();
        })
        .then(function () {
          should.equal(app.isConnected(), false);
        })
        .then(function () {
          helper.deleteIndex(indexName);
          done();
        })
        .catch(done);
    });
  });

});
