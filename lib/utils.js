'use-strict';

var _ = require('lodash'),
    nodeUtil = require('util');

module.exports = _.extend({
  forAll: forAll
}, nodeUtil);


function forAll(obj, callback, currentPath) {
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

  return; void 0;
}
