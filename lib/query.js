'use strict';

const _ = require('lodash'),
  logger = require('./logger'),
  utils = require('./utils'),
  dot = require('dot-object');

module.exports = {
  QueryPromise: QueryPromise,

  parseRequest: parseRequest,
  parseResponse: parseResponse,

  addTermFilters: addTermQuery, // addTermFilters,
  addPagination: addPagination,
  addSorts: addSorts,
  addPopulations: addPopulations,
  addExistenceFilters: addExistenceFilters,

  setMatchAllIfNoQuery: setMatchAllIfNoQuery
};

function QueryPromise(query, func) {
  // We wrap a promise for the query. To allow chaining of methonds
  // in between the 'then-able'. func argument takes a single query argument
  // and returns a promise that is resolved with the found document.
  // This allows calls like, .find().sort().then(...)

  let self = this;
  self.q = _.cloneDeep(query);
  self.p = {
    resolve: function () {
    },
    reject: function () {
    }
  };
  self.isExecuted = false;

  self._exec = function () {
    if (!self.isExecuted) {
      self.isExecuted = true;

      /**
       if(self.q.body){;
        process.nextTick(function(){
          console.log(utils.inspect(self.q.body.query.filtered, { showHidden: true, depth: null }));
        });
      }
       */

      if (self.q.body && self.q.body.query) {
        setMatchAllIfNoQuery(self.q.body.query);
      }

      func(self.q)
        .then(function (res) {
          self.p.resolve(res);
        })
        .catch(function (err) {
          self.p.reject(err);
        });
    }
  };

  self.then = function (resolve, reject) {
    let promise = new Promise(function (success, error) {
      self.p.resolve = success;
      self.p.reject = error;
      self._exec();
    });

    return promise.then(resolve, reject);
  };

  self.populate = function (value) {
    addPopulations(self.q, value);
    return self;
  };

  self.must = function (value) {
    addTermFilters(self.q, value);
    return self;
  };

  self.missing = function (value) {
    addExistenceFilters(self.q, value);
    return self;
  };

  self.exists = function (value) {
    addExistenceFilters(self.q, null, value);
    return self;
  };

  self.not = function (value) {
    addTermFilters(self.q, null, value);
    return self;
  };

  self.sort = function (value) {
    addSorts(self.q, value);
    return self;
  };

  // If .then() is never called, make sure we execute the query.
  // This allows the '.findAndRemove' type queries to still work
  // even when .then() is never called.
  process.nextTick(function () {
    self._exec();
  });
}

function PagedResponse(data) {
  let self = this;
  _.assign(self, data);
}
PagedResponse.prototype.toObject = function () {
  return {
    total: this.total,
    hits: _.map(this.hits, function (h) {
      return h.toObject();
    }),
    page: this.page,
    pages: this.pages
  };
};

PagedResponse.prototype.toJSON = function () {
  return this.toObject();
};

function parseRequest(indices, types, matches, options) {
  options = options || {};
  let req = {
    index: indices,
    type: types,
    body: {
      query: {}//match_all: {}
    }
  };

  let allowedOptions = [];

  if (options.id) {
    allowedOptions = [
      'id',
      'fields',
      'populate'
    ];
  } else if (options.ids) {
    allowedOptions = [
      'ids',
      'fields',
      'populate',
      'sort',
      'page',
      'per_page'
    ];
  } else {
    allowedOptions = [
      'missing',
      'exists',
      'must',
      'not',
      'fields',
      'sort',
      'page',
      'per_page',
      'q',
      'populate'
    ];
  }
  options = _.pick(options, allowedOptions);

  if (options.id) req.id = options.id;
  if (options.ids) {
    req.body.query = {
      ids: {
        values: options.ids
      }
    };
  }

  if (!_.isEmpty(matches)) {
    if (_.isString(matches)) options.q = matches;
    if (_.isPlainObject(matches)) options.must = _.merge({}, options.must, matches);
  }

  if (options.q && _.isString(options.q)) {
    // escape any special characters in the query string
    // see https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html
    options.q = utils.escapeQueryStringQuery(options.q);
    req.body.query = {query_string: {query: options.q}};
  }

  if (options.fields) {
    req.body.fields = _.isArray(options.fields) ? options.fields : [options.fields];
  }

  if (options.sort) {
    addSorts(req, options.sort);
  }

  if (options.page || options.per_page) {
    addPagination(req, options.page, options.per_page);
  }

  if (options.must || options.not) {
    // TODO addTermQuery
    // ES 5.x https://www.elastic.co/guide/en/elasticsearch/reference/5.1/query-dsl-filtered-query.html
    // no more filters by itself
    addTermQuery(req, options.must, options.not, options.missing, options.exists);
    // addTermFilters(req, options.must, options.not, options.missing, options.exists);
  }

  if (options.missing || options.exists) {
    addExistenceFilters(req, options.missing, options.exists);
  }

  // setMatchAllIfNoQuery(query);

  if (!req.hasOwnProperty('size')) {
    // NOTE: we use a high number as our default to return everything
    // because mongoose also does so.
    // ES2.x : lower limit has been assigned 10000
    req.size = 10000;
    req.from = 0;
  }

  return req;
}

function setMatchAllIfNoQuery(query) {
  let nbProperties = Object.keys(query).length;
  if (nbProperties < 1) {
    query.match_all = {};
  } else if (nbProperties > 1 && query.match_all) {
    delete query.match_all;
  }
  return query;
}

function parseResponse(options, query, res) {
  if (query.body && query.body.fields) {
    // elasticsearch wraps field queries in its own body, so we clean it up a bit.
    // all in the name of an easy to use API
    res.hits.hits = _.chain(res.hits.hits)
      .map('fields')
      .map(function (_v) {
        return _.map(_v, function (v, k) {
          let item = {};
          if (_.isArray(v) && v.length === 1) {
            item[k] = v[0];
          } else {
            item[k] = v;
          }
          return item;
        });
      })
      .flatten()
      .value();
  }

  // if _source exists, set the item as _source
  res.hits.hits = _.map(res.hits.hits, function (v) {
    return v._source || v;
  });

  if (options && (options.page || options.per_page)) {
    return new PagedResponse({
      total: res.hits.total,
      hits: res.hits.hits,
      page: options.page,
      pages: Math.ceil(res.hits.total / query.size)
    });
  } else {
    return res.hits.hits;
  }

}

// TODO: ES 5.x
function addExistenceFilters(req, missingFilters, existsFilters) {
  // obsolete in ES 5.x see https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-missing-filter.html
  // obsolete in ES 5.x and https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-filters.html
  // Queries and filters have been merged. Any query clause can now be used as a query in “query context” and as a filter in “filter context”

  // ES 5.x : missing query has been removed because it can be advantageously replaced by an exists query inside a must_not clause
  // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-exists-query.html#_literal_missing_literal_query

  if ((!existsFilters || (!_.isArray(existsFilters) && existsFilters.length < 1))
    && (!missingFilters || (!_.isArray(missingFilters) && missingFilters.length < 1))) {
    // nothing to do
    return;
  }

  // add exists :
  if (!req.body.query.bool) {
    req.body.query.bool = {};
  }

  // add missing to must_not + exists filter

  let makeFilter = function (name, filters) {
    if (filters) {
      filters = _.isArray(filters) ? filters : [filters];
      filters = _.uniq(filters);

      if (!req.body.query.bool[name]) {
        req.body.query.bool[name] = [];
      }

      _.forEach(filters, function (v) {
        let f = {exists: {field: v}};
        req.body.query.bool[name].push(f);
      });
    }
  };

  makeFilter('must_not', missingFilters);
  makeFilter('must', existsFilters);
}

// TODO ES 5.x
function addTermQuery(req, mustFilters, notFilters) {
  let query = {
    // match_all: {},
    bool: {
      must: [],
      must_not: []
    },
    // filter: []
  };

  let makeTermFilter = function (v, k) {
    let f = {};
    if (_.isArray(v)) {
      v = _.uniq(v);
      if (v.length == 1) {
        v = v[0];
      }
    }

    if (_.isArray(v)) {
      f.terms = {};
      f.terms[k] = v;
    } else {
      f.term = {};
      f.term[k] = v;
    }
    return f;
  };

  query.bool.must = _.map(mustFilters, makeTermFilter);
  query.bool.must_not = _.map(notFilters, makeTermFilter);

  // Remove any empty filters, Elasticsearch will throw an error.
  _.each(query.bool, function (v, k) {
    if (!v || !v.length) {
      delete query.bool[k];
    }
  });

  // No filters found? return now.
  if (_.isEmpty(query.bool)) {
    return undefined;
  }

  // Is this a new filtered query, or an existing to merge with?
  let boolFilter = dot.pick('body.query.bool', req);

  let mergeFilter = function (filterName, data) {
    if (_.isArray(boolFilter[filterName])) {
      req.body.query.bool[filterName] = req.body.query.bool[filterName].concat(data);
    } else if (_.isPlainObject(boolFilter[filterName])) {
      req.body.query.bool[filterName] = [boolFilter[filterName]];
      req.body.query.bool[filterName] = req.body.query.bool[filterName].concat(data);
    } else {
      req.body.query.bool[filterName] = data;
    }
  };

  // Query / bool [must, must not] | filter []
  // does req contains boolFilters ? ==> merge them with current values
  if (boolFilter) {
    if (query.bool.must) {
      mergeFilter('must', query.bool.must);
    }
    if (query.bool.must_not) {
      mergeFilter('must_not', query.bool.must_not);
    }
  } else {
    // provide query
    // TODO ES 5.x  bool query vs filtered query
    if (!req.body.query) {
      req.body.query = {bool: query.bool};
    } else {
      req.body.query.bool = query.bool;
    }
    /*
     req.body.query = {

     bool: query.bool,
     // new filtered
     filtered: {
     query: req.body.query, // match
     filter: query // term
     }
     };*/
  }

  ///Pretty sure elasticsearch doesn't allow arrays for 'must' when only one rule is added.
  /* if (req.body.query.bool.must
   && req.body.query.bool.must.length === 1) {
   req.body.query.bool.must = req.body.query.bool.must[0];
   }
   if (req.body.query.bool.must_not && req.body.query.bool.must_not.length === 1) {
   req.body.query.bool.must_not = req.body.query.bool.must_not[0];
   }*/
}

// TODO : Not in elasticsearch 5.x, should be removed
/**
 * @obsolete Not in elasticsearch 5.x, should be removed
 * https://www.elastic.co/guide/en/elasticsearch/reference/5.1/query-dsl-filtered-query.html
 * @param req
 * @param mustFilters
 * @param notFilters
 * @returns {*}
 */
function addTermFilters(req, mustFilters, notFilters) {
  return addTermQuery(req, mustFilters, notFilters);
  return;
  //TODO
  let filter = {
    bool: {
      must: [],
      must_not: []
    }
  };

  let makeTermFilter = function (v, k) {
    let f = {};
    if (_.isArray(v)) {
      f.terms = {};
      f.terms[k] = v;
    } else {
      f.term = {};
      f.term[k] = v;
    }
    return f;
  };

  filter.bool.must = _.map(mustFilters, makeTermFilter);
  filter.bool.must_not = _.map(notFilters, makeTermFilter);

  // Remove any empty filters, Elasticsearch will throw an error.
  _.each(filter.bool, function (v, k) {
    if (!v || !v.length) delete filter.bool[k];
  });

  // No filters found? return now.
  if (_.isEmpty(filter.bool)) return undefined;

  // Is this a new filtered query, or an existing to merge with?
  let boolFilter = dot.pick('body.query.filtered.filter.bool', req);

  let mergeFilter = function (filterName, data) {
    if (_.isArray(boolFilter[filterName])) {
      req.body.query.filtered.filter.bool[filterName] = req.body.query.filtered.filter.bool[filterName].concat(data);
    } else if (_.isPlainObject(boolFilter[filterName])) {
      req.body.query.filtered.filter.bool[filterName] = [boolFilter[filterName]];
      req.body.query.filtered.filter.bool[filterName] = req.body.query.filtered.filter.bool[filterName].concat(data);
    } else {
      req.body.query.filtered.filter.bool[filterName] = data;
    }
  };

  if (boolFilter) {
    if (filter.bool.must) mergeFilter('must', filter.bool.must);
    if (filter.bool.must_not) mergeFilter('must_not', filter.bool.must_not);
  } else {
    req.body.query = {
      filtered: {
        query: req.body.query,
        filter: filter
      }
    };
  }

  ///Pretty sure elasticsearch doesn't allow arrays for 'must' when only one rule is added.
  if (req.body.query.filtered.filter.bool.must
    && req.body.query.filtered.filter.bool.must.length === 1) {
    req.body.query.filtered.filter.bool.must = req.body.query.filtered.filter.bool.must[0];
  }
  if (req.body.query.filtered.filter.bool.must_not && req.body.query.filtered.filter.bool.must_not.length === 1) {
    req.body.query.filtered.filter.bool.must_not = req.body.query.filtered.filter.bool.must_not[0];
  }

}

function addPagination(req, page, per_page) {
  if (!page && !per_page) return undefined;
  page = isNaN(parseInt(page)) || (page <= 0) ? 1 : parseInt(page);
  per_page = isNaN(parseInt(per_page)) || (per_page <= 1) ? 10 : parseInt(per_page);
  req.from = (page - 1) * per_page;
  req.size = per_page;
}

function addSorts(req, sorts) {
  sorts = _.isString(sorts) ? [sorts] : sorts;

  let result = {
    sort: []
  };

  let makeSort = function (sort) {
    let item = {}, order;
    if (_.startsWith(sort, '-')) {
      sort = sort.substring(1);
      order = 'desc';
    } else {
      order = 'asc';
    }
    item[sort] = {
      order: order,
      // ES 5.x ignore_unmapped removed
      // https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-sort.html#_ignoring_unmapped_fields
      // ignore_unmapped: true
    };
    return item;
  };

  result.sort = _.map(sorts, makeSort);

  if (result.sort.length === 1) {
    result.sort = result.sort[0];
  }

  if (_.isArray(req.body.sort)) {
    req.body.sort = req.body.sort.concat(result.sort);
  } else {
    req.body.sort = result.sort;
  }
}

function addPopulations(req, value) {
  if (!req.populate) req.populate = [];
  req.populate.push(value);
}
