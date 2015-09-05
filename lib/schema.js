'use-strict';

var schemaTypes = require('./schema-types'),
    errors = require('./errors'),
    dot = require('dot-object'),
    ValidationtError = errors.ValidationtError,
     _ = require('lodash');

module.exports = Schema;

function Schema(schema, options) {
  this.fields =_.cloneDeep(buildFieldsFromSchema(schema).fields);
  Object.defineProperty(this, 'options', {
    value: _.merge({}, options),
    configurable: false,
    writable: false
  });
}

Schema.prototype.validate = function (doc, partial) {
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
      schemaType = findType(value[0]);
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
