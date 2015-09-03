'use-strict';

var _ = require('lodash');

function Schema(fields, options) {
  Object.defineProperty(this, 'fields', {
    value: fields,
    configurable: false,
    writable: false
  });
  Object.defineProperty(this, 'fieldOptions', {
    value: {},
    configurable: false,
    writable: false
  });
  Object.defineProperty(this, 'mappings', {
    value: mapProperties(this.fields),
    configurable: false,
    writable: false
  });
}

Schema.prototype.validate = function (doc) {
  var errors = [];
  _.each(this.fields, function (e, key) {
    if(!_.has(doc, key)){
      if(!_.has(e, 'default')){
        errors.push('Schema violation missing property ' + key + ' from schema.');
      }
    }
  });
  return errors.length ? errors : void 0;
}

Schema.prototype.applySchema = function (doc) {
  return _.mapValues(this.fields, function (e, key) {
    var value = doc[key];
    if(value){
      return value;
    }else if (_.has(e, 'default')){
      return e.default;
    }else{
      throw new Error('Schema violation missing property ' + key + ' from schema.');
    }
  });
}

function mapProperties(fields) {
  // TODO: find a way to get deep embeded objects to have type of object
  return _.mapValues(fields,function(value,key){
    if(_.includes(Schema.types, value)) {
      return { type: value };
    } else if( Schema.types[value] ) {
      if(key ==='type') {
        return Schema.types[value];
      } else {
        return { type: Schema.types[value] };
      }
    } else if( _.isPlainObject(value) ) {
      var newProps = mapProperties(value);

      if(newProps.type && newProps.type.type){
        return _.merge({ type: 'object' }, newProps.type);
      }else{
        return _.merge({ type: 'object' }, newProps);
      }

    } else {
      return value;
    }
  });
}

// MAPPING DOC https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html
// CORE TYPES https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-core-types.html

// Check the Schema tests for the multiple ways a stype can be defined.
Schema.types = {};
Schema.types.Object = Schema.types[Object] = Schema.types['object'] = 'object';
Schema.types.String = Schema.types[String] = Schema.types['string'] = 'string';
Schema.types.Date = Schema.types[Date] = Schema.types['date'] = 'date';
Schema.types.Boolean = Schema.types[Boolean] = Schema.types['boolean'] =  'boolean';
Schema.types.Number = Schema.types.Integer = Schema.types[Number] = Schema.types['number'] = 'integer';
Schema.types.Float = Schema.types['float'] = 'float';
Schema.types.Double = Schema.types['double'] = 'double';
Schema.types.Long = Schema.types['long'] = 'long';
Schema.types.Short = Schema.types['short'] = 'short';
Schema.types.Byte = Schema.types['byte'] = 'byte';
Schema.types.Binary = Schema.types['binary'] = 'binary';

module.exports = Schema
