'use-strict';

var elasticsearch = require('../index.js'),
    should = require('should');

var Car = elasticsearch.model('car');
var car = new Car({color:'Blue'});

describe('Model', function(){
  before(function(done){
    elasticsearch.connect('esodm-test').then(function(){
      done();
    }).catch(done);
  });

  describe('Instance Methods', function(){

    describe('.save()', function(){
      it('saves a new document', function(done){
        car.save().then(function(doc){
          doc = doc.toObject();
          doc.should.have.property('id');
          doc.should.have.property('createdOn');
          doc.should.have.property('updatedOn');
          doc.should.have.property('color', 'Blue');
          done();
        }).catch(done);
      });
    });

    describe('.update()', function(){
      it('updates an instance document', function(done){
        car.update({make:'Ford'}).then(function(doc){
          doc.should.have.property('color', 'Blue');
          doc.should.have.property('make', 'Ford');
          done();
        }).catch(done);
      });
    });

    describe('.remove()', function(){
      it('removes an instance document', function(done){
        car.remove().then(function(doc){
          car.should.not.have.property('id');
          car.should.have.property('isNew', true);
          done();
        }).catch(done);
      });
    });
  });

  describe('Static Methods', function(){
    describe('.count()', function(){
      it('counts all documents', function(done){
        var car = new Car({color:'Red'});
        car.save()
        .then(function(){
          return Car.count();
        })
        .then(function(count){
          count.should.have.property('count').and.be.a.Number();
          return car.remove();
        })
        .then(function(){
          done();
        }).catch(done);
      });
    });
    describe('.create()', function(){
      it('creates a new document', function(done){
        Car.create({color:'Red'})
        .then(function(doc){
          doc.should.have.property('id');
          doc.should.have.property('createdOn');
          doc.should.have.property('updatedOn');
          doc.should.have.property('color', 'Red');
          done();
        }).catch(done);
      });
    });
    describe('.find()', function(){
      it('finds a document by query', function(done){
        var car = new Car({name:'Honda'});
        car.save()
        .then(function(){
          return Car.find({name: car.name});
        })
        .then(function(results){
          results.should.be.instanceof(Array);
          results[0].should.have.property('name', car.name);
          return car.remove();
        })
        .then(function(){
          done();
        }).catch(done);
      });
    });
    describe('.findAndRemove()', function(){
      it('finds a document by query and remove it', function(done){
        var car = new Car({name:'Ford'});
        car.save()
        .then(function(doc){
          return Car.findAndRemove({name: doc.name});
        })
        .then(function(){
          done();
        }).catch(done);
      });
    });
    describe('.findById()', function(){
      it('finds a document by id', function(done){
        var car = new Car({color:'Red'});
        car.save()
        .then(function(doc){
          return Car.findById(doc.id);
        })
        .then(function(doc){
          doc.should.have.property('id', car.id);
          doc.should.have.property('color', 'Red');
          return doc.remove();
        })
        .then(function(){
          done();
        }).catch(done);
      });
    });
  });

  describe('Model Schemas', function(){
    var bookSchema = new elasticsearch.Schema({author: String});
    var Book;
    var book;

    it('creates a new model with schema', function(done){
       Book = elasticsearch.model('Book', bookSchema);
       done();
    });

    it('validates a good document', function(done){
      book = new Book({author:'Jim'});
      var errors = book.validate(book.toObject());
      should.not.exist(errors);
      done();
    });

    it('invalidates a document with wrong field type', function(done){
      book = new Book({author: 34634634});
      var errors = book.validate(book.toObject());
      should.exist(errors);
      done();
    });

    it('invalidates a document with missing required field', function(done){
      var CD =  elasticsearch.model('CD', new elasticsearch.Schema({author: String, name: { type: String, required: true} }));
      var cd = new CD({author: 'Dr Dre'});
      var errors = cd.validate(cd.toObject());
      should.exist(errors);
      done();
    });

    it('it wont save a document with missing required field', function(done){
      var Dog =  elasticsearch.model('Dog', new elasticsearch.Schema({breed: String}));
      var dog = new Dog({breed: true});
      dog.save().then(function(results){
        done(new Error('The invalid document still saved, it should have thrown an error.'));
      }).catch(function(err){
        done();
      });
    });
  });

});
