'use-strict';

var _ = require('lodash'),
    nodeUtil = require('util');

module.exports = _.extend({
  forAll: forAll,
  isISO8601: isISO8601,
  isBase64: isBase64,
  isInteger: isInteger,
  isFloat: isFloat,
  isShort: isShort,
  isLong: isLong,
  isByte: isByte,
  inRange: inRange,
  escapeQueryStringQuery: escapeQueryStringQuery

}, nodeUtil);


var expressions = {
  iso8601: RegExp(/^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?/.source + '$'),
  base64: RegExp(/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?/.source + '$'),
  float: RegExp(/^[-+]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/.source + '$')
};

function forAll(obj, callback, currentPath) {
  // calls back for every nested object.
  if (!currentPath) currentPath = [];
  if (obj) Object.keys(obj).forEach(compute);

  function compute(key) {
    var value = obj[key];
    if (typeof value !== 'object') {
      callback(currentPath, key, obj);
    } else {
      var path = currentPath.slice(0);
      path.push(key);
      forAll(value, callback, path);
    }
  }

  return void 0;
}

function isISO8601(v) {
  return expressions.iso8601.test(v);
}

function isBase64(v){
  return expressions.base64.test(v);
}

function isInteger(v){
  return typeof v === "number" && isFinite(v) && Math.floor(v) === v && inRange(v, -2147483648, 2147483647);
}

function isFloat(v){
  //return expressions.float.test(v) && !isNaN(parseFloat(v)) && (v%1!=0);
  // Removed previous line because we need logic to allow numbers without decimals, eg '2' should still be a valid float
  // Adding temp workaround to allow all numbers as valid floats for now (elasticsearch can coherce anyways)
   return typeof v === "number";
}

function isShort(v){
  return isInteger(v) && inRange(v, -32768, 32767);
}

function isLong(v){
  return typeof v === "number" && isFinite(v) && Math.floor(v) === v && inRange(v, -9223372036854775808, 9223372036854775807);
}

function isByte(v){
  return isInteger(v) && inRange(v, -128, 127);
}

function inRange(v, min, max) {
  return v >= min && v <= max;
}

function escapeQueryStringQuery(query){
var regexString,
    regex;

  // Taken from https://github.com/lanetix/ng-elasticsearch-sanitize/blob/master/src/ng-elastic-escape.js
  query = query
    .replace(/([-!(){}\[\]^"~*?:\+\/\\])/g, '\\$1') // replace single character special characters
    .replace(/(\|\|)/g, '\\$1') // replace ||
    .replace(/(\&\&)/g, '\\$1'); // replace &&
  _.map(['AND', 'OR', 'NOT'], function (operator) {
    regexString = 's*\\b(' + operator + ')\\b\\s*'
    regex = new RegExp(regexString, 'g');
    query = query.replace(regex,
      _.map(operator.split(''),
        function (ch) {
          return '\\' + ch;
        }
      ).join('') +' '
    )
  });
  return query;
}
