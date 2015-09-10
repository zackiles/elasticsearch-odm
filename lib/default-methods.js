'use-strict';

var Query = require('./query'),
    errors = require('./errors'),
    MissingArgumentError = errors.MissingArgumentError,
    Promise = require('bluebird'),
    _ = require('lodash');

module.exports = {

  count: function() {
    return this.db.client.count({
      index: this.db.index,
      type: this.model.type,
    });
  },

  create: function(data) {
    if (!data) return Promise.reject(new MissingArgumentError('data'));
    data.createdOn = data.createdOn = new Date().toISOString();
    data.updatedOn = data.updatedOn = new Date().toISOString();

    var self = this;
    return self.db.client.create({
      index: self.db.index,
      type: self.model.type,
      body: data
    })
    .then(function(result) {
      return self.update(result._id, {
        id: result._id
      });
    });
  },

  update: function(id, data) {
    if (!id) return Promise.reject(new MissingArgumentError('id'));
    if (!data) return Promise.reject(new MissingArgumentError('data'));

    data.updatedOn = new Date().toISOString();

    var self = this;
    return self.db.client.update({
      index: self.db.index,
      type: self.model.type,
      id: id,
      body: {
        doc: data
      }
    })
    .then(function() {
      return self.findById(id);
    });
  },

  find: function(match, queryOptions) {
    var self = this;

    var func = function(query){
      return self.db.client.search(query).then(function(results) {
        if (results.hits.total >= 1) {
          results = Query.parseResponse(queryOptions, query, results);
          if (queryOptions && (queryOptions.page || queryOptions.per_page)) {
            results.hits = self.makeInstance(results.hits);
          } else {
            results = self.makeInstance(results);
            if (!_.isArray(results)) results = [results];
          }
          return results;
        } else {
          return [];
        }
      });
    };

    var query = Query.parseRequest(self.db.index, self.model.type, match, queryOptions);

    return new Query.QueryPromise(query, func);
  },

  findAndRemove: function(match) {
    if (_.isEmpty(match)) return Promise.reject(new MissingArgumentError('match'));

    var self = this;
    // we could use elasticsearchs deleteByQuery() but it will be deprecated in version 2
    // so we just fetch all id's, and run a normal delete query on then.
    return self.find(match, { fields: 'id' }).then(function(results) {
      if (!results || !results.length) return void 0;

      var bulkOps = _.chain(results)
        .each()
        .map(function(v) {
          return {
            'delete': {
              '_index': self.db.index,
              '_type': self.model.type,
              '_id': v.id
            }
          };
        })
        .value();

      return self.db.client.bulk({body: bulkOps});
    });
  },

  findById: function(id, fields) {
    if (!id) return Promise.reject(new MissingArgumentError('id'));

    var self = this;

    var func = function(query){
      return self.db.client.get(query)
      .then(function(results) {
        if (results.found === true) {
          return self.makeInstance(results._source);
        } else {
          return void 0;
        }
      });
    };

    var queryOptions = {
      index: self.db.index,
      type: self.model.type,
      id: id
    };

    if(fields) queryOptions.fields = _.isArray(fields) ? fields : [fields];
    var query = Query.parseRequest(self.db.index, self.model.type, null, queryOptions);
    // get requests shouldn't include a body;
    delete query.body;
    return new Query.QueryPromise(query, func);
  },

  findByIds: function(ids, fields) {
    if (!ids) return Promise.reject(new MissingArgumentError('ids'));
    if (_.isString(ids)) return self.findById(ids, fields);

    var self = this;
    var func = function(query){
      return self.db.client.get(query).then(function(results) {
        if (results.docs && results.docs.length) {
          results.docs = results.docs.filter(function(d) {
            return d && d._source;
          });
          return self.makeInstance(results.docs);
        } else {
          return [];
        }
      });
    };

    var queryOptions = {
      index: self.db.index,
      type: self.model.type,
      ids: ids
    };

    if(fields) queryOptions.fields = _.isArray(fields) ? fields : [fields];
    var query = Query.parseRequest(self.db.index, self.model.type, null, queryOptions);
    return new Query.QueryPromise(query, func);
  },

  findOne: function(match, fields) {
    if (_.isEmpty(match)) return Promise.reject(new MissingArgumentError('match'));
    var self = this;

    var func = function(query){
      return self.db.client.search(query).then(function(results) {
        results = Query.parseResponse(results);

        if (results && results.hits && results.hits.length) {
          results = self.makeInstance(results.hits[0]);
          return results;
        } else {
          return void 0;
        }
      });
    };

    var queryOptions = {
      page: 0,
      per_page: 1
    };

    if (fields) queryOptions.fields = _.isArray(fields) ? fields : [fields];
    var query = Query.parseRequest(self.db.index, self.model.type, match, queryOptions);

    return new Query.QueryPromise(query, func);
  },

  findOneAndRemove: function(match) {
    if (_.isEmpty(match)) return Promise.reject(new MissingArgumentError('match'));

    var self = this;
    return self.findOne(match).then(function(results) {
      return results ? self.remove(results.id) : void 0;
    });
  },

  remove: function(id) {
    if (!id) return Promise.reject(new MissingArgumentError('id'));

    return this.db.client.delete({
      index: this.db.index,
      type: this.model.type,
      id: id
    });
  },

  removeByIds: function(ids) {
    if (!ids) return Promise.reject(new MissingArgumentError('ids'));

    return this.findAndRemove({id: ids});
  },

  set: function(id, document) {
    var self = this;

    if (!id) return Promise.reject(new MissingArgumentError('id'));
    if (!document) return Promise.reject(new MissingArgumentError('document'));

    // just to be save, force id.so it's not removed.
    document.id = id;

    return self.db.client.index({
      index: self.db.index,
      type: self.model.type,
      id: id,
      body: document
    })
    .then(function() {
      return self.makeInstance(document);
    });
  },

  makeInstance: function(documents) {
    var self = this;
    if (!documents) return Promise.reject(new MissingArgumentError('documents'));

    var make = function(document) {
      return new self.model.constructor(document || {});
    };

    if (_.isArray(documents)) {
      var models = [];
      _.forEach(documents, function(document) {
        models.push(make(document));
      });
      return models;
    } else {
      return make(documents);
    }
  },

  toMapping: function() {
    // toMapping is only for models with schemas
    if(!this.model.schema) return void 0;

    var mapping = {};
    mapping[this.model.type] = {};
    _.extend(mapping[this.model.type], this.model.schema.toMapping());
    return mapping;
  }

};
