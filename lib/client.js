'use strict';

let logger = require('./logger'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  elasticsearch = require('elasticsearch');

module.exports.makeClient = function (options) {
  return new elasticsearch.Client(getClientSettings(options));
};

function getClientSettings(options) {
  let clientSettings = {
    apiVersion: '5.0',
    keepAlive: true,
    //log: 'trace',
    defer: function () {
      let resolve, reject;
      let promise = new Promise(function () {
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
  if (options.trace == true) {
    clientSettings.log = 'trace';
  } else if (options.logging) {
    clientSettings.log = function () {
      let log = logger;
      this.error = log.error.bind(log);
      this.warning = log.warn.bind(log);
      this.info = log.info.bind(log);
      this.debug = log.debug.bind(log);
      this.trace = function (method, req, body, res, status) {
        let parts = req.path.split('/');
        let meta = {
          host: req.protocol + '//' + req.hostname + ':' + req.port,
          index: options.index,
          type: parts[2] || '',
          response: status,
          queryString: parts[parts.length - 1],
          queryBody: body || ''
        };
        if (status !== 200) {
          meta.responseBody = res;
          log.trace('[ELASTICSEARCH] ' + method + ' @ ', meta);
        }
      };
      this.close = function () {
      };
    };
  }
  return _.merge(clientSettings, _.omit(options, 'logging'));
}
