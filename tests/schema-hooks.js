'use-strict';

var Schema = require('../lib/schema.js'),
    _ = require('lodash'),
    should = require('should');

describe('Schema-Hooks', function(){
  var schema = new Schema();
  var context = {name: 'value'};

  it('Kareem is working', function(done){
    var Kareem = require('kareem');
    var hooks = new Kareem();

    var count1 = 0;
    var count2 = 0;

    hooks.pre('cook', function(cb) {
      ++count1;
      cb();
    });

    hooks.pre('cook', function(cb) {
      ++count2;
      cb();
    });

    hooks.execPre('cook', null, function() {
      count1.should.equal(1);
      count2.should.equal(1);
      done();
    });
  });

  it('adds and executes pre hooks', function(done){
    var count = 0;
    schema.pre('save', function(cb){
      ++count;
      should(this.name).and.equal(context.name);
      cb();
    });
    schema.pre('save', function(cb){
      ++count;
      should(this.name).and.equal(context.name);
      cb();
    });

    schema.hooks.execPre('save', context, function(err) {
      count.should.equal(2);
      done();
    });
  });

  it('adds and executes post hooks', function(done){
    var count = 0;
    schema.post('save', function(ctx, cb){
      count += 1;
      should(ctx.name).and.equal(context.name);
      cb();
    });
    schema.post('save', function(ctx, cb){
      count += 1;
      should(ctx.name).and.equal(context.name);
      cb();
    });
    schema.hooks.execPost('save', null, [context], function(err) {
      count.should.equal(2);
      done();
    });
  });

  it('hooks return an error if an error is passed to done', function(done){
    schema.pre('save', function(cb){
      cb(new Error());
    });
    schema.post('save', function(ctx, cb){
      cb(new Error());
    });
    schema.hooks.execPre('save', context, function(err) {
      err.should.be.instanceof(Error);
      schema.hooks.execPost('save', null, [context], function(err) {
        err.should.be.instanceof(Error);
        done();
      });
    });
  });

  it('hook instances are distinct between schemas', function(done){
    var schema1 = new Schema();

    schema.pre('save', function(){
      throw new Error('An older insace hook was executed.');
    });

    schema1.pre('save', function(){
      should(this.name).and.equal(context.name);
    });

    schema1.hooks.execPre('save', context, function(err) {
      done();
    });
  });
});
