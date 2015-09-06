'use strict';

var _ = require('lodash'),
    errors = require('./errors');

module.exports = {
  parseRequest: parseRequest,
  parseResponse: parseResponse
};

function parseRequest(indices, types, matches, options){
  var req = {
    index: indices,
    type: types,
    body: {
      query: {match_all: {}}
    }
  };
  options = _.pick(_.cloneDeep(options), [
    'must',
    'not',
    'fields',
    'sort',
    'page',
    'per_page',
    'random',
    'q'
  ]) || {};

  if(_.isString(matches)) options.q = matches;

  if(options.q){
    req.body.query = { query_string: {query: options.q} };
  }

  if(options.fields){
    req.body.fields = _.isArray(options.fields) ? options.fields : [options.fields];
  }

  if(options.sort){
    addSorts(req, options.sort);
  }else{
    // default to order descending createdOn, unless sort is provided.
    addSorts(req, '-createdOn');
  }

  if(options.page || options.per_page){
    addPagination(req, options.page, options.per_page);
  }

  if(matches){
    if(_.isObject(matches) && !_.isEmpty(matches)) options.must = _.merge({}, options.must, matches);
    if(_.isString(matches)) options.q = matches;
  }

  if(options.random){
    req.body.query.function_score = {
      random_score: { seed: new Date().getDay() }
    }
  }

  if(options.must || options.not){
    if(options.q) throw errors.ElasticsearchError('Option \'q\' must not be used with must, not or matches.');
    addTermFilters(req, options.must, options.not);
  }


  if(!req.hasOwnProperty('size')) {
    // NOTE: we use a high number as our default to return everything
    // because mongoose also does so.
    req.size = 999999;
    req.from = 0;
  }
  return req;
}

var PagedResponse = function(data){
  var self = this;
  _.extend(self, data);

  self.prototype = {
    toObject: function(){
      return {
        total: self.total,
        hits: _.map(self.hits, function(h){return h.toObject(); }),
        page: self.page,
        pages: self.pages
      };
    },
    toJSON: function(){
      return JSON.stringify(self.toObject());
    }
  };
};

function parseResponse(options, query, res){

  if(query.body && query.body.fields){
    // elasticsearch wraps field queries in its own body, so we clean it up a bit.
    // all in the name of an easy to use API
    res.hits.hits = _.chain(res.hits.hits)
      .pluck('fields')
      .map(function(_v){
        return _.map(_v, function(v, k){
          var item = {};
          if(_.isArray(v) && v.length === 1){
            item[k] = v[0];
          }else{
            item[k] = v;
          }
          return item;
        });
      })
      .flatten()
      .value();
  }

  // if _source exists, set the item as _source
  res.hits.hits = _.map(res.hits.hits, function(v){
    return v['_source'] || v;
  });

  if(options && (options.page || options.per_page)){
    return new PagedResponse({
      total: res.hits.total,
      hits: res.hits.hits,
      page: options.page,
      pages: Math.ceil(res.hits.total / query.size)
    });
  }else{
    return res.hits.hits;
  }

}

function addMatchQueries(req, matches){
  var query = {
    match: {}
  };

  _.forOwn(matches, function(v, k){
    query.match[k] = v;
  });

  req.body.query = query;
}

function addTermFilters(req, mustFilters, mustNotFilters){
  var filter = {
    bool: {
      must: [],
      must_not: []
    }
  };

  var makeFilter = function(v, k){
    var f = {};
    if(_.isArray(v)){
      f.terms = {};
      f.terms[k] = v;
    }else{
      f.term = {};
      f.term[k] = v;
    }
    return f;
  };

  filter.bool.must = _.map(mustFilters, makeFilter);
  filter.bool.must_not = _.map(mustNotFilters, makeFilter);
  _.each(filter.bool, function(v, k) {
    if(!v || !v.length) delete filter.bool[k];
  });
  if(filter.bool.must && filter.bool.must.length === 1) filter.bool.must = filter.bool.must[0];
  if(filter.bool.must_not && filter.bool.must_not.length === 1) filter.bool.must_not = filter.bool.must_not[0];

  if(!_.isEmpty(filter.bool)){
    req.body.query = {
      filtered: {
        query: req.body.query,
        filter: filter
      }
    }
  }
}

function addPagination(req, page, per_page){
  if(!page && !per_page) return void 0;
  page = isNaN(parseInt(page)) || (page <= 0) ? 1 : parseInt(page);
  per_page = isNaN(parseInt(per_page)) || (per_page <= 1) ? 10 : parseInt(per_page);
  req.from =  (page - 1) * per_page;
  req.size = per_page;
}

function addSorts(req, sorts){
  sorts = _.isString(sorts) ? [sorts] : sorts;

  var result = {
    sort: []
  }

  var makeSort = function(sort){
    var item = {}, order;
    if(_.startsWith(sort, '-')){
      sort = sort.substring(1);
      order = 'desc';
    }else{
      order = 'asc';
    }
    item[sort] = {order: order, ignore_unmapped: true};
    return item;
  };

  result.sort = _.map(sorts, makeSort);

  if(result.sort.length === 1){
    result.sort = result.sort[0];
  }

  req.body.sort = result.sort;
}
