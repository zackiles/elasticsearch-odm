'use-strict';

var app = require('../index.js'),
    should = require('should');

var Car = app.model('car');
var car = new Car({color:'Blue'});

describe('Model', function(){
  before(function(done){
    this.timeout(10000);
    app.connect('esodm-test').then(function(){
      done();
    }).catch(done);
  });

  describe('Instance Methods', function(){

    describe('.save()', function(){
      it('saves a new document', function(done){
        car.save().then(function(doc){
          doc = doc.toObject();
          doc.should.have.property('id');
          car.should.have.property('isNew', false);
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

    describe('.set()', function(){
      var setCar = new Car({color:'Orange', type: 'Ford'});

      before(function(done){
        setCar.save().then(function(){
          return setCar.set({color: 'Maroon'}).then(function(results){
            done();
          });
        })
      });

      it('sets a document', function(done){
        setCar.should.have.property('color', 'Maroon');
        done();
      });

      it('removes any properties that weren\'t set', function(done){
        setCar.should.not.have.property('type');
        done();
      });

      it('does not remove id property', function(done){
        setCar.should.have.property('id', setCar.id);
        done();
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
      var car;
      this.timeout(10000);
      before(function(done){
        car = new Car({
          name:'Honda',
          parts: [{
            serial: '0000-ASFBNERHQDF'
          }]
        });
        car.save().then(function(){
          done();
        }).catch(done);
      });
      it('finds a document by match query', function(done){
        Car.find({name: car.name})
        .then(function(results){
          results.should.be.instanceof(Array);
          results[0].should.have.property('name', car.name);
          done();
        })
        .catch(done);
      });
      it('finds a document using query chaining', function(done){
        Car.find()
        .sort('createdOn')
        .must({name: car.name})
        .then(function(results){
          results.should.be.instanceof(Array);
          results[0].should.have.property('name', car.name);
          done();
        })
        .catch(done);
      });
      after(function(done){
        car.remove().then(function(){
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
    var bookSchema = new app.Schema({author: String});
    var Book;
    var book;

    it('creates a new model with schema', function(done){
       Book = app.model('Book', bookSchema);
       done();
    });

    it('creates an elasticsearch mapping', function(done){
      Book = app.model('Book', bookSchema);
      var mapping = Book.toMapping();
      mapping.should.have.property(Book.model.type)
      .and.have.property('properties')
      .and.have.property('author')
      .and.have.property('type', 'string');
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

    it('setting options.type for scehma forces a customt type name', function(done){
      var schema = new app.Schema({author: String}, {type: 'CustomType'})
      var SomeModel =  app.model('SomeModel', schema);
      SomeModel.model.should.have.property('type', 'CustomType');
      done();
    });

    it('invalidates a document with missing required field', function(done){
      var CD =  app.model('CD', new app.Schema({author: String, name: { type: String, required: true} }));
      var cd = new CD({author: 'Dr Dre'});
      var errors = cd.validate(cd.toObject());
      should.exist(errors);
      done();
    });

    it('it wont save a document with missing required field', function(done){
      var Dog =  app.model('Dog', new app.Schema({breed: String}));
      var dog = new Dog({breed: true});
      dog.save().then(function(results){
        done(new Error('The invalid document still saved, it should have thrown an error.'));
      }).catch(function(err){
        done();
      });
    });
  });

});
