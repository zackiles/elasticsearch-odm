'use strict';

var logger = require('./logger'),
    _ = require('lodash'),
    Promise = require('bluebird'),
    elasticsearch = require('elasticsearch');

module.exports.makeClient = function(options){
  return new elasticsearch.Client(getClientSettings(options));
};

function getClientSettings(options){
  var clientSettings = {
    apiVersion: '1.7',
    keepAlive: true,
    defer: function () {
      var resolve, reject;
      var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
      });
      return {
        resolve: resolve,
        reject: reject,
        promise: promise
      };
    }
  };
  if(options.logging) {
    clientSettings.log = function(){
      var log = logger;
      this.error = log.error.bind(log);
      this.warning = log.warn.bind(log);
      this.info = log.info.bind(log);
      this.debug = log.debug.bind(log);
      this.trace = function (method, req, body, res, status) {
        var parts = req.path.split('/');
        var meta = {
            host : req.protocol + '//' + req.hostname + ':' + req.port,
            index : options.index,
            type :  parts[2] || '',
            response : status,
            queryString : parts[parts.length-1],
            queryBody : body || ''
        };
        if(status !== 200) {
          meta.responseBody = res;
          log.trace('[ELASTICSEARCH] ' + method + ' @ ', meta);
        }
      };
      this.close = function () {  };
    };
  }
  return _.merge(clientSettings, _.omit(options, 'logging'));
}
