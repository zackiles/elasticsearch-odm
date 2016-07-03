'use-strict';

var requireNew = require('require-new'),
  should = require('should'),
  helper = require('./helper');

describe('Connection', function () {

  describe('connect and disconnect properly', function () {

    it('connect', function (done) {
      var app = requireNew('../index');
      should.equal(app.isConnected(), false);
      helper.connect(app)
        .then(function () {
          should.equal(app.isConnected(), true);
        })
        .then(function () {
          return helper.remove(app);
        })
        .then(function(){
          done();
        })
        .catch(done);
    });

    it('connect with custom settings', function (done) {
      var app = requireNew('../index');
      should.equal(app.isConnected(), false);
      helper.connect(app, 10)
        .then(function () {
          return helper.getSettings(app);
        })
        .then(function (settings) {
          should.equal(settings['index.number_of_shards'], 10);
        })
        .then(function () {
          return helper.remove(app);
        })
        .then(function(){
          done();
        })
        .catch(done);
    });

    it('disconnect', function (done) {
      var app = requireNew('../index');
      var indexName;
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
