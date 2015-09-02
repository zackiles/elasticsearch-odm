'use-strict';

var Query = require('./query'),
  errors = require('./errors'),
  Promise = require('bluebird'),
  _ = require('lodash');

var defaultMethods = module.exports = {

  count: function() {
    return this.db.client.count({
      index: this.db.index,
      type: this.__internal.type,
    });
  },

  create: function(data) {
    if(!data) return errors.missingArgument('data');
    data.createdOn = data.createdOn = new Date().toISOString();
    data.updatedOn = data.updatedOn = new Date().toISOString();

    var self = this;
    return self.db.client.create({
        index: self.db.index,
        type: self.__internal.type,
        body: data
      })
      .then(function(result) {
        return self.update(result._id, {
          id: result._id
        });
      });
  },

  update: function(id, data) {
    if(!id) return errors.missingArgument('id');
    if(!data) return errors.missingArgument('data');

    data.updatedOn = new Date().toISOString();

    var self = this;
    return self.db.client.update({
        index: self.db.index,
        type: self.__internal.type,
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

    var query = Query.parseRequest(self.db.index, self.__internal.type, match, queryOptions);

    return self.db.client.search(query).then(function(results) {
      if(results.hits.total >= 1){
        results = Query.parseResponse(queryOptions, query, results);
        if(queryOptions && (queryOptions.page || queryOptions.per_page)) {
          results.hits = self.makeInstance(results.hits);
        } else {
          results = self.makeInstance(results);
          if(!_.isArray(results)) results = [results];
        }
        return results;
      }else{
        return [];
      }
    });
  },

  findAndRemove: function(match) {
    if(_.isEmpty(match)) return errors.missingArgument('match');

    var self = this;
    // we could use elasticsearchs deleteByQuery() but it will be deprecated in version 2
    // so we just fetch all id's, and run a normal delete query on then.
    return self.find(match, {fields: 'id'}).then(function(results){
      if(!results || !results.length) return void 0;

      var bulkOps = _.chain(results)
        .each()
        .map(function(v, k){
          return {
            'delete': {
              '_index': self.db.index,
              '_type': self.__internal.type,
              '_id': v.id
            }
          }
        })
        .value();

      return self.db.client.bulk({
        body: bulkOps
      });
    });
  },

  findById: function(id, fields) {
    if(!id) return errors.missingArgument('id');

    var self = this;
    var queryOptions = {
      index: self.db.index,
      type: self.__internal.type,
      id: id
    };
    if(fields) queryOptions.fields = _.isArray(fields) ? fields : [fields];

    return self.db.client.get(queryOptions).then(function(results) {
      if(results.found === true) {
        return self.makeInstance(results._source);
      } else {
        return void 0;
      }
    });
  },

  findByIds: function(ids, fields) {
    if(!ids) return errors.missingArgument('ids');
    if(_.isString(ids)) return self.findById(ids, fields);

    var self = this;
    var queryOptions = {
      index: self.db.index,
      type: self.__internal.type,
      ids: ids
    };
    if(fields) queryOptions.fields = _.isArray(fields) ? fields : [fields];

    return self.db.client.get(queryOptions).then(function(results) {
      if(results.docs && results.docs.length) {
        results.docs = results.docs.filter(function(d) {
          return d && d._source;
        });
        return self.makeInstance(results.docs);
      } else {
        return [];
      }
    });
  },

  findOne: function(match, fields) {
    if(_.isEmpty(match)) return errors.missingArgument('match');

    var self = this;
    var queryOptions = {
      must: match
    };
    if(fields) queryOptions.fields = _.isArray(fields) ? fields : [fields];

    var query = Query.parseRequest(self.db.index, self.__internal.type, queryOptions);
    return self.db.client.search(query)
      .then(function(results) {
        results = Query.parseResponse(results);
        if(results && results.hits && results.hits.length) {
          results = self.makeInstance(results.hits[0]);
          return results;
        } else {
          return void 0;
        }
      });
  },

  findOneAndRemove: function(match) {
    var self = this;
    if(_.isEmpty(match)) return errors.missingArgument('match');

    return self.findOne(match).then(function(results) {
      return results ? self.remove(results.id) : void 0;
    });
  },

  remove: function(id) {
    if(!id) return errors.missingArgument('id');

    return this.db.client.delete({
      index: this.db.index,
      type: this.__internal.type,
      id: id
    });
  },

  set: function(id, document) {
    var self = this;

    if(!id) return errors.missingArgument('id');
    if(!document) return errors.missingArgument('document');

    return this.db.client.index({
        index: this.db.index,
        type: this.__internal.type,
        id: id,
        body: document
      })
      .then(function() {
        if(self.isInstance) {
          return self;
        } else {
          return self.makeInstance(document);
        }
      });
  },

  makeInstance: function(documents) {
    var self = this;
    if(!documents) return errors.missingArgument('documents');

    var make = function(document) {
      var model = new self.__internal.constructor(document || {});
      return model;
    };
    if(_.isArray(documents)) {
      var models = [];
      _.forEach(documents, function(document) {
        models.push(make(document));
      });
      return models;
    } else {
      return make(documents);
    }
  }

};
