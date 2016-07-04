/**
 * Index helper
 */
var Promise = require('bluebird'),
  _ = require('lodash'),
  should = require('should'),
  elasticsearch = require('elasticsearch');

var helper = function () {
  var module = {};

  // avoid test collision by using a different index name
  // in case a test fails, next test will not use same index
  var testIndex = 0;

  var testIndexName = 'eodm-test';

  var testOptions = {
    // fastest index creation for elasticsearch
    settings: {
      index: {
        number_of_shards: 1,
        number_of_replicas: 0
      }
    }
  };

  var testIndexOptions = {
    index: testIndexName,
    options: testOptions
    // ,trace: true // Trace only for dev
  };

  // default Elasticsearch client
  var client = new elasticsearch.Client();

  var latestIndex;

  module.generateIndexName = function () {
    latestIndex = testIndexName + '_' + (testIndex++);
    return latestIndex;
  };

  module.getOptions = function (shards) {
    var tmp = _.cloneDeep(testIndexOptions);
    tmp.index = module.generateIndexName();
    if (shards) {
      // for test purpose
      tmp.options.settings.index.number_of_shards = shards;
    }
    return tmp;
  };

  module.waitForStatus = function (app) {
    return new Promise(function (success, error) {
      if (!app.isConnected()) {
        error('not connected');
      }
      // http://localhost:9200/_cluster/health?wait_for_status=yellow&timeout=50s
      app.client.cluster.health({
        waitForStatus: 'green',
        index: latestIndex,
        level: 'indices'
      }, function (err, response, status) {
        if (err) {
          error(err);
        } else {
          success(response);
        }
      });
    });
  };

  module.connect = function (app, shards) {
    var options = module.getOptions(shards);

    return new Promise(function (success, error) {
      client.indices.delete({
          index: options.index
        },
        function (err, response, status) {
          if (err && err.displayName != 'NotFound') {
            error(err);
          } else {
            success();
          }
        });
    })
      .then(function () {
        return app.connect(options)
      })
      .then(function () {
        return module.waitForStatus(app);
      });
  };

  module.remove = function (app) {
    return app
      .removeIndex(latestIndex)
      .then(app.disconnect);
  };

  module.getMapping = function (app, typeName) {
    return new Promise(function (success, error) {
      var esType = typeName.toLowerCase() + 's';
      app.client.indices.getMapping({
          index: latestIndex,
          type: esType
        },
        function (err, response, status) {
          if (err) {
            error(err);
          } else {
            if (response
              && response[latestIndex]
              && response[latestIndex].mappings[esType]) {
              success(response[latestIndex].mappings[esType]);
            } else {
              error('mapping not found on response');
            }
          }
        });
    });
  };

  module.getSettings = function (app) {
    return new Promise(function (success, error) {
      app.client.indices.getSettings({
          index: latestIndex,
          flatSettings: true
        },
        function (err, response, status) {
          if (err) {
            error(err);
          } else {
            if (response[latestIndex]
              && response[latestIndex].settings) {
              success(response[latestIndex].settings);
            } else {
              error('settings not found on response');
            }
          }
        });
    });
  };

  /**
   * Force index refresh since ES will not give any result
   * for find() if document is created but index not refreshed
   * @param app
   */
  module.refresh = function (app) {
    return new Promise(function (success, error) {
      app.client.indices.refresh({
          index: latestIndex,
          force: true
        },
        function (err, response, status) {
          if (err) {
            error(err);
          } else {
            success();
          }
        });
    });
  };

  module.deleteIndex = function (indexName) {
    return new Promise(function (success, error) {
      var client = new elasticsearch.Client();
      client.indices.delete({
          index: indexName || latestIndex
        },
        function (err, response, status) {
          if (err) {
            client.close();
            error(err);
          } else {
            client.close();
            success();
          }
        });
    });
  };

  return module;
};

module.exports = helper();
