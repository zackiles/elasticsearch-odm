'use strict';

var logger = require('./logger'),
    _ = require('lodash'),
    Promise = require('bluebird'),
    elasticsearch = require('elasticsearch');

module.exports = Client;

function getClientSettings(host, index, loggingEnabled){
  var clientSettings = {
    host: host,
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
  if(loggingEnabled) {
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
            index : index,
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
  return clientSettings;
}

function Client(config){
  if(_.isEmpty(config)) throw new Error('No Elasticsearch configuration provided');
  if(!config.host) throw new Error('No Elasticsearch host provided');
  if(!config.index) throw new Error('No Elasticsearch index provided');
  return new elasticsearch.Client(getClientSettings(config.host, config.index, config.loggingEnabled));
}
