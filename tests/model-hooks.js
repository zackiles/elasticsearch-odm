'use-strict';

var app = require('../index.js'),
    should = require('should');

var schema,
    Model,
    model;

describe('Model-Hooks', function(){
  this.timeout(20000);

  before(function(done){
    app.connect('esodm-test').then(function(){
      done();
    }).catch(done);
  });

  describe('.save()', function(){

    beforeEach(function(){
      schema = new app.Schema();
    });

    it('pre hook executes', function(done){
      schema.pre('save', function(cb){
        should.exist(cb);
        should.exist(this)
        this.should.have.property('name', 'something');
        this.name = 'newthing';
        cb();
      });
      Model = app.model(Date.now().toString(), schema);
      model = new Model({name: 'something'});

      model.save().then(function(){
        model.should.have.property('name', 'newthing');
        done();
      }).catch(done);
    });

    it('post hook executes', function(done){
      schema.post('save', function(context){
        should.exist(context);
        context.should.have.property('id');
        context.should.have.property('name', 'something');
        done();
      });
      Model = app.model(Date.now().toString(), schema);
      model = new Model({name: 'something'});

      model.save().catch(done);
    });

    it('pre hook rejects with error', function(done){
      schema.pre('save', function(cb){
        cb(new Error());
      });
      Model = app.model(Date.now().toString(), schema);
      model = new Model({name: 'something'});

      model.save().then(function(){
        done(new Error('hook did not throw error'));
      })
      .catch(function(err){
        err.should.be.instanceof(Error);
        done();
      });
    });
  });

  describe('.remove()', function(){
    beforeEach(function(){
      schema = new app.Schema();
    });

    it('pre hook executes', function(done){
      schema.pre('remove', function(cb){
        should.exist(cb);
        should.exist(this);
        this.should.have.property('id');
        this.should.have.property('name', 'something');
        cb();
      });
      Model = app.model(Date.now().toString(), schema);
      model = new Model({name: 'something'});

      model.save().then(function(doc){
        return doc.remove();
      })
      .then(function(){
        done();
      })
      .catch(done);
    });

    it('pre hook rejects with error', function(done){
      schema.pre('remove', function(doc, cb){
        should.exist(cb);
        should.exist(doc);
        cb(new Error());
      });
      Model = app.model(Date.now().toString(), schema);
      model = new Model({name: 'something'});

      model.save().then(function(doc){
        return doc.remove();
      })
      .then(function(){
        done(new Error('hook did not reject with error'));
      })
      .catch(function(err){
        should(err).exist;
        done();
      });
    });

    it('post hook executes', function(done){
      schema.post('remove', function(doc){
        should.exist(doc);
        done();
      });
      Model = app.model(Date.now().toString(), schema);
      model = new Model({name: 'something'});

      model.save().then(function(doc){
        return doc.remove();
      })
      .catch(done);
    });
  });
});
