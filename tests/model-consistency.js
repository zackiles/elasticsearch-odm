'use-strict';

var elasticsearch = require('../index.js'),
    should = require('should'),
    Promise = require('bluebird'),
    _ = require('lodash');

var getUnique = function(){
  return _.uniqueId(Date.now().toString());
};

describe('Model-Consistency', function(){

  before(function(done){
    this.timeout(10000);
    elasticsearch.connect('esodm-test').then(function(){
      done();
    }).catch(done);
  });

   describe('model.remove()', function(){
     it('it removes documents consistenly', function(done){
        var promises = [];
        var makePromise = function(){
          var Model = elasticsearch.model(getUnique());
          var instance;
          var promise = new Model({name: getUnique()}).save()
          .then(function(results){
            instance = results.toObject();
            return results.remove();
          })
          .then(function(){
            return Model.findById(instance.id);
          })
          .then(function(results){
            should.not.exist(results);
          })
          .catch(function(){
            return Promise.resolve();
          });
        }
        for (var i = 0; i < 100; i++) {
          promises.push(makePromise());
        }
        Promise.all(promises).then(function(){
          done();
        });
     });
   });

  describe('model.update()', function(){
    it('it updates documents consistenly', function(done){
      var promises = [];
      var makePromise = function(){
        var first;
        var newName = getUnique();
        var Model = elasticsearch.model(getUnique());
        var promise = new Model({name: getUnique()}).save()
        .then(function(results){
          first = results.toObject();
          return results.update({name:newName});
        })
        .then(function(results){
          if(results.name === newName){
            first.name = newName;
            first.updatedOn = results.updatedOn;
            results = results.toObject();
            first.should.eql(results);
          }else{
            return Promise.reject(new Error('Update not consisten'));
          }
          return Model.removeByIds([first.id, results.id]);
        });
      };
      for (var i = 0; i < 100; i++) {
        promises.push(makePromise());
      }
      Promise.all(promises).then(function(){
        done();
      });
    });
  });

});
