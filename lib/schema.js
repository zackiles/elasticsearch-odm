'use-strict';

var schemaTypes = require('./schema-types'),
    errors = require('./errors'),
    ValidationtError = errors.ValidationtError,
     _ = require('lodash');

module.exports = Schema;

function Schema(schema, options) {
  var fields = _.cloneDeep(schema);
  var mappings = {};

  Object.keys(fields).forEach(mapSchemaType)

  function mapSchemaType(key) {
    var value = fields[key];
    var schemaType;
    var typeOptions;
    if (_.isPlainObject(value)) {

      if(!value.type) return mapSchemaType(value);
      typeOptions = _.omit(value, 'type');
      if(_.isArray(value.type)){
        schemaType = findType(value.type[0]);

      }else{
        schemaType = findType(value.type);
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
      fields[key] = new schemaType(typeOptions);
      mappings[key] = fields[key].toMapping();
    }
  }

  Object.defineProperty(this, 'fields', {
    value: fields,
    configurable: false,
    writable: false
  });

  Object.defineProperty(this, 'options', {
    value: _.cloneDeep(options) || {},
    configurable: false,
    writable: false
  });

  Object.defineProperty(this, 'mappings', {
    value: mappings,
    configurable: false,
    writable: false
  });
}

Schema.prototype.validate = function (doc, partial) {
  var errs = [];
  var self = this;

  _.forOwn(self.fields, function(v, k){

    if(doc[k]){
      if(v.constructor.compare(doc[k]) === false){
        errs.push(new ValidationtError(self, k, 'Not of type "' + v.constructor.esType + '".'));
      }
    }else{
      if(v.required && !partial) errs.push(new ValidationtError(self, k, 'Required field is missing.'));
    }

  });

  return errs.length ? errs : void 0;
};

function findType(item){
  var sType;
  _.forOwn(schemaTypes, function(v, k){
    if(item === v.jsType || item === v.esType) sType = v;
  });
  return sType;
}
