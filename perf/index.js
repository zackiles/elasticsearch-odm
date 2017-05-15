'use strict';

let app = require('../index'),
    Promise = require('bluebird'),
    Benchmark = require('benchmark');

let suite = new Benchmark.Suite;
let Model = app.model('Book');

app.connect('esodm-test').then(function(){
  modelSuite();
});

let ids = [];

function modelSuite(){
  suite
  .add('new Model()', function() {
    new Model({name: 'GoodBook'});
  })
  .add('model.save()', {
    'defer': true,
    'fn': function(deferred) {
      suite.name;
      new Model({name: 'GoodBook'}).save().then(function(results){
        ids.push(results.id);
        deferred.resolve();
      });
    }
  })
  .add('model.remove()', {
    'defer': true,
    'fn': function(deferred) {
      suite.name;
      new Model({name: 'GoodBook'}).save()
      .then(function(results){
        return results.remove();
      })
      .then(function(){
        deferred.resolve();
      });
    }
  })
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    Model.removeByIds(ids).then(function(results){
      console.log('finished teardown of', results.items.length, 'items');
    });
  })
  .run({async:true});
}
