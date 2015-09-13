'use-strict';

var app = require('../index.js'),
    should = require('should');

var schema,
    Model,
    model;

describe('Model-Hooks', function(){
  before(function(done){
    this.timeout(10000);
    app.connect('esodm-test').then(function(){
      done();
    }).catch(done);
  });

  describe('.save()', function(){
    beforeEach(function(){
      schema = new app.Schema();
      Model = app.model(Date.now().toString(), schema);
      model = new Model({name: 'something'});
    });
    afterEach(function(done){
      model.remove().then(function(){
        done();
      }).catch(done);
    });

    it('pre save hook', function(done){
      this.timeout(5000);
      schema.pre('save', function(cb){
        should.exist(cb);
        should.exist(this)
        this.should.have.property('name', 'something');
        this.name = 'newthing';
        cb();
      });
      model.save().then(function(){
        model.should.have.property('name', 'newthing');
        done();
      }).catch(done);
    });

    it('post save hook', function(done){
      this.timeout(5000);
      schema.post('save', function(context, cb){
        should.exist(context);
        should.exist(cb);
        context.should.have.property('id');
        context.should.have.property('name', 'something');
        cb();
      });
      model.save().then(function(){
        done();
      }).catch(done);
    });
  });

  describe('.remove()', function(){
    var calledPost = false;
    var calledPre = false;

    before(function(done){
      schema = new app.Schema();
      schema.pre('remove', function(cb){
        should.exist(this);
        should.exist(cb);
        this.should.have.property('id');
        this.should.have.property('name', 'something');
        calledPre = true;
        cb();
      });
      schema.post('remove', function(context, cb){
        should.exist(context);
        should.exist(cb);
        context.should.have.property('id');
        context.should.have.property('name', 'something');
        calledPost = true;
        cb();
      });
      Model = app.model(Date.now().toString(), schema);
      model = new Model({name: 'something'});
      model.save()
      .then(function(){
        return model.remove();
      })
      .then(function(){
        done();
      })
      .catch(done);
    });

    it('pre remove hook', function(){
      calledPre.should.equal(true);
    });

    it('post remove hook', function(){
      calledPost.should.equal(true);
    });
  });
});
