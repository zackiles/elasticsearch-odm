'use-strict';

var schemaTypes = require('./schema-types'),
    errors = require('./errors'),
    Dot = require('dot-object'),
    ValidationtError = errors.ValidationtError,
     _ = require('lodash');

// sets ovverides in dot object
// see https://github.com/rhalff/dot-object/issues/8
var dot = new Dot('.', true);

module.exports = Schema;

function Schema(schema, options) {
  this.fields =_.cloneDeep(buildFieldsFromSchema(schema).fields);
  Object.defineProperty(this, 'options', {
    value: _.merge({}, options),
    configurable: false,
    writable: false
  });
}

Schema.prototype.toMapping = function() {
  var properties = {};

  var checkLeaf = function(obj, path){
    _.forOwn(obj, function(v, k){
      var currentPath = path ? path + '.' + k : k;
      if(v.type){
        var field = {type: v.type.esType};
        // we extend the type definition with any user supplied options.
        // these options can be any options listed for Elasticsearch Core Types.
        // see https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-core-types.html
        var defaults = {};

        // NOTE: This is opinionated. Setting to not_analyzed doesn't
        // allow full text search. But since we are trying to be like Mongoose
        // we assume this is most helpful to users as a default. This option
        // can still be overridden in the schema.
        if(v.type.jsType === String) defaults.index = 'not_analyzed';

        _.extend(field, defaults, v.options);
        dot.str(currentPath, field, properties);
      }else{
        checkLeaf(v, currentPath);
      }
    });
  };

  checkLeaf(this.fields);

  return {
    properties: properties
  };
};

Schema.prototype.validate = function(doc, partial) {
  var errs = [];
  var self = this;

  var checkType = function(fieldType, path){
    var docField = dot.pick(path, doc);

    if(docField){
      if(fieldType.type.compare(docField) === false){
        errs.push(new ValidationtError(self, path, 'Not of type "' + fieldType.esType + '".'));
      }
    }else{
      if(fieldType.options.required && !partial){
        errs.push(new ValidationtError(self, path, 'Required field is missing.'));
      }
    }
  };

  var checkLeaf = function(obj, path){
    _.forOwn(obj, function(v, k){
      // build a dot notation path to be used with 'dot-object'
      var currentPath = path ? path + '.' + k : k;

      // if a leaf contains a type property, then it's a type definition
      // otherwise it's a nested document.
      if(v.type){
        checkType(v, currentPath);
      }else{
        checkLeaf(v, currentPath);
      }
    });
  };

  checkLeaf(self.fields);
  return errs.length ? errs : void 0;
};

function buildFieldsFromSchema(fields){

  var results = {
    fields: {}
  };

  Object.keys(fields).forEach(function(v){
    mapSchemaType(v);
  });

  function mapSchemaType(key, path) {
    var value = dot.pick(path ? path + '.' + key : key, fields);
    var schemaType;
    var typeOptions = {};

    if (_.isPlainObject(value)) {

      if(value.type){
        typeOptions = _.omit(value, 'type');

        if(_.isArray(value.type)){
          // mapping as an array is just a helper so it's similar to mongoose
          // elasticsearch doesn't actually care if it's defined as an array.
          schemaType = findType(value.type[0]);
        }else{
          schemaType = findType(value.type);
        }

      }else{
        // it's a nested document, recursively map it too add add to currentPath
        Object.keys(value).forEach(function(v){
          mapSchemaType(v, key);
        });
      }

    }else if(_.isFunction(value)) {
      schemaType = findType(value);
    }else if(_.isArray(value)){
      // it is either a nested object array, or it's just a type definiton
      // that has been wrapped in an array element. if it's a nested object
      // array, then we'll recursively map it's inner types.
      // see https://www.elastic.co/guide/en/elasticsearch/guide/current/complex-core-fields.html#object-arrays
      // and https://www.elastic.co/guide/en/elasticsearch/guide/current/nested-objects.html
      if(_.isPlainObject(value[0])){
        Object.keys(value[0]).forEach(function(v){
          mapSchemaType(v, key);
        });
      }else{
        schemaType = findType(value[0]);
      }

    }else if(_.isString(value)){
      schemaType = findType(value);
    }else{
      schemaType = findType(value);
    }

    if(schemaType) {
      var fieldObj = {
        type: schemaType,
        options: typeOptions
      };
      if(path){
        dot.str(path + '.' + key, fieldObj, results.fields);
      }else{
        results.fields[key] = fieldObj;
      }
    }
  }

  return results;
}

function findType(item){
  var sType;
  _.forOwn(schemaTypes, function(v, k){
    if(item === v.jsType || item === v.esType) sType = v;
  });
  return sType;
}
