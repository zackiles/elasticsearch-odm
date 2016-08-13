'use-strict';

var _ = require('lodash'),
    utils = require('./utils');

module.exports = {
  ObjectType: ObjectType,
  StringType: StringType,
  DateType: DateType,
  BooleanType: BooleanType,
  IntegerType: IntegerType,
  FloatType: FloatType,
  DoubleType: DoubleType,
  LongType: LongType,
  ShortType: ShortType,
  ByteType: ByteType,
  BinaryType: BinaryType,
  GeoPointType: GeoPointType
};

// MAPPING DOC https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html
// CORE TYPES https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-core-types.html

// Check the Schema tests for the multiple ways a type can be defined.

function Type(options){
  if(_.isPlainObject(options)){
    _.assign(this.options, options);
  }
}
Type.prototype.toMapping = function(value){
  return {type: this.constructor.esType };
};

function ObjectType(options){
  Type.call(this, options);
}
utils.inherits(ObjectType, Type);
ObjectType.esType = 'object';
ObjectType.jsType = Object;
ObjectType.compare = _.isPlainObject;


function StringType(options){
  Type.call(this, options);
}
utils.inherits(StringType, Type);
StringType.esType = 'string';
StringType.jsType = String;
StringType.compare = _.isString;


function DateType(options){
  Type.call(this, options);
}
utils.inherits(DateType, Type);
DateType.esType = 'date';
DateType.jsType = Date;
DateType.compare = utils.isISO8601;


function BooleanType(options){
  Type.call(this, options);
}
utils.inherits(BooleanType, Type);
BooleanType.esType = 'boolean';
BooleanType.jsType = Boolean;
BooleanType.compare = _.isBoolean;

function NumberType(options){
  Type.call(this, options);
}
utils.inherits(NumberType, Type);
NumberType.prototype.validate = function(value){
  if(this.max && value > this.max) return false;
  if((this.min || this.min ===0) && value < options.min) return false;
  return this.compare(value);
};

function IntegerType(options){
  NumberType.call(this, options);
}
utils.inherits(IntegerType, NumberType);
IntegerType.esType = 'integer';
IntegerType.compare = utils.isInteger;

function FloatType(options){
  NumberType.call(this, options);
}
utils.inherits(FloatType, NumberType);
FloatType.esType = 'float';
FloatType.compare = utils.isFloat;

function DoubleType(options){
  NumberType.call(this, options);
}
utils.inherits(DoubleType, NumberType);
DoubleType.esType = 'double';
DoubleType.compare = utils.isFloat;

function LongType(options){
  NumberType.call(this, options);
}
utils.inherits(LongType, NumberType)
LongType.jsType = Number;
LongType.esType = 'long';
LongType.compare = utils.isLong;

function ShortType(options){
  NumberType.call(this, options);
}
utils.inherits(ShortType, NumberType);
ShortType.esType = 'short';
ShortType.compare = utils.isShort;

function ByteType(options){
  NumberType.call(this, options);
}
utils.inherits(ByteType, NumberType);
ByteType.esType = 'byte';
ByteType.compare = utils.isByte;

function BinaryType(options){
  Type.call(this, options);
}
utils.inherits(BinaryType, Type);
BinaryType.esType = 'binary';
BinaryType.compare = utils.isBase64;

function GeoPointType(options){
  Type.call(this, options);
}
utils.inherits(GeoPointType, Type);
GeoPointType.esType = 'geo_point';
GeoPointType.compare = utils.isFloat;
