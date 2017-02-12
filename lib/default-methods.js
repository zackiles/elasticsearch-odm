'use-strict';

const Query = require('./query'),
  errors = require('./errors'),
  MissingArgumentError = errors.MissingArgumentError,
  Promise = require('bluebird'),
  _ = require('lodash');

module.exports = {

  count: function () {
    return this.db.client.count({
      index: this.db.index,
      type: this.model.type,
    });
  },

  create: function (data, options) {
    options = options || {};
    if (!data) return Promise.reject(new MissingArgumentError('data'));
    data.createdOn = data.createdOn = new Date().toISOString();
    data.updatedOn = data.updatedOn = new Date().toISOString();

    let self = this;
    return self.db.client.index({
      index: self.db.index,
      type: self.model.type,
      body: data,
      refresh: false // dont use refresh here, as it's refresh when we update with id.
    })
      .then(function (result) {
        return self.update(result._id, {id: result._id}, options);
      });
  },

  update: function (id, data, options) {
    options = options || {};
    if (!id) return Promise.reject(new MissingArgumentError('id'));
    if (!data) return Promise.reject(new MissingArgumentError('data'));

    data.updatedOn = new Date().toISOString();

    let self = this;
    return self.db.client.update({
      index: self.db.index,
      type: self.model.type,
      id: id,
      refresh: options.refresh || false,
      body: {
        doc: data
      }
    })
      .then(function (res) {
        return self.findById(id);
      });
  },

  search: function (queryOptions, query) {
    let self = this;
    return self.db.client.search(query).then(function (results) {

      results = Query.parseResponse(queryOptions, query, results);
      // is this a pages request or normal?
      if (queryOptions && (queryOptions.page || queryOptions.per_page)) {
        if (results.hits.length) {
          results.hits = self.makeInstance(results.hits);
        }
      } else {
        results = self.makeInstance(results);
        // this method will always return an array.
        if (!_.isArray(results)) results = [results];
      }
      return results;
    });
  },

  find: function (match, queryOptions) {
    let self = this;
    queryOptions = _.isPlainObject(queryOptions) ? queryOptions : {};
    let query = Query.parseRequest(self.db.index, self.model.type, match, queryOptions);

    return new Query.QueryPromise(query, function (q) {
      return self.search(queryOptions, q);
    });
  },

  findAndRemove: function (match, queryOptions, options) {
    if (_.isEmpty(match) && _.isEmpty(queryOptions)) return Promise.reject(new MissingArgumentError('match'));

    options = _.isPlainObject(options) ? options : {};
    queryOptions = _.isPlainObject(queryOptions) ? queryOptions : {};
    queryOptions = _.pick(queryOptions, ['q', 'must', 'not', 'exists', 'missing']);
    // ES 5.x .fields obsolete, replaced by stored_fields
    queryOptions.stored_fields = 'id';

    let self = this;
    // we could use elasticsearchs deleteByQuery() but it will be deprecated in version 2
    // so we just fetch all id's, and run a normal delete query on then.
    return self.find(match, queryOptions)
      .then(function (results) {
        if (!results || !results.length) return [];

        let bulkOps = _.chain(results)
          .each()
          .map(function (v) {
            return {
              'delete': {
                '_index': self.db.index,
                '_type': self.model.type,
                '_id': v.id
              }
            };
          })
          .value();

        return self.db.client.bulk({body: bulkOps, refresh: options.refresh || false});
      });
  },

  findById: function (id, queryOptions) {
    if (!id) return Promise.reject(new MissingArgumentError('id'));

    let self = this;
    queryOptions = _.isPlainObject(queryOptions) ? queryOptions : {};

    let func = function (query) {
      return self.db.client.getSource(query)
        .then(function (results) {
          return self.makeInstance(results);
        });
    };
    queryOptions.id = id;

    let query = Query.parseRequest(self.db.index, self.model.type, null, queryOptions);
    // get requests shouldn't include a body; from or size
    delete query.body;
    delete query.from;
    delete query.size;
    return new Query.QueryPromise(query, func);
  },

  findByIds: function (ids, queryOptions) {
    if (!ids) return Promise.reject(new MissingArgumentError('ids'));
    if (_.isString(ids)) return self.findById(ids, queryOptions);

    let self = this;
    queryOptions = _.isPlainObject(queryOptions) ? queryOptions : {};
    queryOptions.ids = ids;

    let query = Query.parseRequest(self.db.index, self.model.type, null, queryOptions);

    return new Query.QueryPromise(query, function (q) {
      return self.search(queryOptions, q);
    });
  },

  findOne: function (match, queryOptions) {
    if (_.isEmpty(match) && _.isEmpty(queryOptions)) return Promise.reject(new MissingArgumentError('match'));

    let self = this;
    queryOptions = _.isPlainObject(queryOptions) ? queryOptions : {};
    // Safe default, assuming many matches return the newest.
    queryOptions.sort = queryOptions.sort || '-createdOn';
    queryOptions.page = 0;
    queryOptions.per_page = 1;
    let func = function (query) {
      return self.search(queryOptions, query).then(function (results) {
        if (results && results.hits && results.hits.length) {
          return results.hits[0];
        } else {
          return undefined;
        }
      });
    };

    let query = Query.parseRequest(self.db.index, self.model.type, match, queryOptions);

    return new Query.QueryPromise(query, func);
  },

  findOneAndRemove: function (match, queryOptions, options) {
    if (_.isEmpty(match)) return Promise.reject(new MissingArgumentError('match'));

    let self = this;
    queryOptions = _.isPlainObject(queryOptions) ? queryOptions : {};
    options = _.isPlainObject(options) ? options : {};

    return self.findOne(match, queryOptions).then(function (results) {
      if (results && results.id) {
        return self.remove(results.id, options).then(function () {
          return results;
        })
      } else {
        return [];
      }
    });
  },

  remove: function (id, options) {
    options = options || {};
    if (!id) return Promise.reject(new MissingArgumentError('id'));

    return this.db.client.delete({
      index: this.db.index,
      refresh: options.refresh || false,
      type: this.model.type,
      id: id
    });
  },

  removeByIds: function (ids) {
    if (!ids) return Promise.reject(new MissingArgumentError('ids'));

    return this.findAndRemove({id: ids});
  },

  set: function (id, document, options) {
    if (!id) return Promise.reject(new MissingArgumentError('id'));
    if (!document) return Promise.reject(new MissingArgumentError('document'));

    let self = this;
    options = _.isPlainObject(options) ? options : {};

    // just to be safe, force id.so it's not removed.
    document.id = id;

    return self.db.client.index({
      index: self.db.index,
      type: self.model.type,
      id: id,
      refresh: options.refresh || false,
      body: document
    })
      .then(function () {
        return self.makeInstance(document);
      });
  },

  makeInstance: function (documents) {
    let self = this;
    if (!documents) return Promise.reject(new MissingArgumentError('documents'));

    let make = function (document) {
      return new self.model.constructor(document || {});
    };

    if (_.isArray(documents)) {
      let models = [];
      _.forEach(documents, function (document) {
        models.push(make(document));
      });
      return models;
    } else {
      return make(documents);
    }
  },

  toMapping: function () {
    // toMapping is only for models with schemas
    if (!this.model.schema) return undefined;

    let mapping = {};
    mapping[this.model.type] = {};
    _.assign(mapping[this.model.type], this.model.schema.toMapping());
    return mapping;
  }

};
