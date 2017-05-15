/**
 * Index helper
 */
let Promise = require('bluebird'),
  _ = require('lodash'),
  should = require('should'),
  elasticsearch = require('elasticsearch');

let helper = function () {
  let module = {};

  // avoid test collision by using a different index name
  // in case a test fails, next test will not use same index
  let testIndex = 0;

  let testIndexName = 'eodm-test';

  let testOptions = {
    // fastest index creation for elasticsearch
    settings: {
      index: {
        number_of_shards: 1,
        number_of_replicas: 0
      }
    }
  };

  let testIndexOptions = {
    index: testIndexName,
    options: testOptions
    // ,trace: true // Trace only for dev
  };

  // default Elasticsearch client
  let client = new elasticsearch.Client();

  let latestIndex;

  module.generateIndexName = function () {
    latestIndex = testIndexName + '_' + (testIndex++);
    return latestIndex;
  };

  module.getOptions = function (shards) {
    let tmp = _.cloneDeep(testIndexOptions);
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
    let options = module.getOptions(shards);
   // console.log(JSON.stringify(options));

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
      let esType = typeName.toLowerCase() + 's';
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
          // ES 5.x : seems not existing  even if on doc
          // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-indices-refresh
          // vs https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-refresh.html
          // force: true
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
      let client = new elasticsearch.Client();
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
