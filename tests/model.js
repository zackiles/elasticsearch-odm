'use-strict';

var requireNew = require('require-new'),
  app = requireNew('../index.js'),
  should = require('should'),
  helper = require('./helper');

var Car = app.model('car');
var car = new Car({color: 'Blue'});

describe('Model', function () {

  before(function (done) {
    this.timeout(10000);
    helper.connect(app)
      .then(function () {
        console.log('connecting');
        done();
      })
      .catch(done);
  });

  after(function (done) {
    this.timeout(10000);
    helper.remove(app)
      .then(function () {
        console.log('remove');
        done();
      })
      .catch(done);
  });

  describe('Instance Methods', function () {

    it('properties shared between instances', function () {
      var Model1 = app.model('Mg3q5gherheh');
      var Model2 = app.model('Mg3q5gherheh');
      delete Model1.db;
      should.not.exist(Model2.db);
    });

    it('not_analyzed default mapping properties', function (done) {
      var typeName = 'nameTestType';
      var NameTestModel = app.model(typeName);

      var nameTest = new NameTestModel({name: 'test', test: 'another string'});
      nameTest.save()
        .then(function () {
          return helper.getMapping(app, typeName);
        })
        .then(function (mapping) {
          mapping.should.have.property('properties');
          mapping.properties.name.should.have.property('index', 'not_analyzed');
          mapping.properties.id.should.have.property('index', 'not_analyzed');
          mapping.properties.slug.should.have.property('index', 'not_analyzed');
          mapping.properties.test.should.have.property('index', 'not_analyzed');
          done();
        })
        .catch(done);
    });

    it('not_analyzed default mapping properties with Schema', function (done) {
      var typeName = 'nameTestType2';
      var nameTestSchema = new app.Schema({
        name : String,
        test2 : String
      });
      var NameTestModel = app.model(typeName,nameTestSchema);

      var nameTest = new NameTestModel({name: 'test', test2: 'another string'});
      nameTest.save()
        .then(function () {
          return helper.getMapping(app, typeName);
        })
        .then(function (mapping) {
          mapping.should.have.property('properties');
          mapping.properties.test2.should.have.property('index', 'not_analyzed');
          done();
        })
        .catch(done);
    });

    describe('.save()', function () {
      it('saves a new document', function (done) {
        this.timeout(3000);
        car.save()
          .then(function (doc) {
            doc = doc.toObject();
            doc.should.have.property('id');
            car.should.have.property('isNew', false);
            doc.should.have.property('createdOn');
            doc.should.have.property('updatedOn');
            doc.should.have.property('color', 'Blue');
            done();
          })
          .catch(done);
      });
    });

    describe('.update()', function () {
      it('updates an instance document', function (done) {
        car.update({make: 'Ford'})
          .then(function (doc) {
            doc.should.have.property('color', 'Blue');
            doc.should.have.property('make', 'Ford');
            done();
          })
          .catch(done);
      });
    });

    describe('.remove()', function () {
      it('removes an instance document', function (done) {
        car.remove().then(function (doc) {
          car.should.not.have.property('id');
          car.should.have.property('isNew', true);
          done();
        }).catch(done);
      });
    });

    describe('.set()', function () {
      var setCar = new Car({color: 'Orange', type: 'Ford'});

      before(function (done) {
        setCar.save().then(function () {
          return setCar.set({color: 'Maroon'}).then(function (results) {
            done();
          });
        })
      });

      it('sets a document', function (done) {
        setCar.should.have.property('color', 'Maroon');
        done();
      });

      it('removes any properties that weren\'t set', function (done) {
        setCar.should.not.have.property('type');
        done();
      });

      it('does not remove id property', function (done) {
        setCar.should.have.property('id', setCar.id);
        done();
      });
    });
  });

  describe('Model Schemas', function () {
    var bookSchema = new app.Schema({author: String});

    it('creates a new model with schema', function (done) {
      var Book = app.model('Book', bookSchema);
      done();
    });

    it('creates an app mapping', function (done) {
      var Book = app.model('Book', bookSchema);
      var mapping = Book.toMapping();
      mapping.should.have.property(Book.model.type)
        .and.have.property('properties')
        .and.have.property('author')
        .and.have.property('type', 'string');
      done();
    });

    it('validates a good document', function (done) {
      var Book = app.model('Book', bookSchema);
      var book = new Book({author: 'Jim'});
      var errors = book.validate(book.toObject());
      should.not.exist(errors);
      done();
    });

    it('invalidates a document with wrong field type', function (done) {
      var Book = app.model('Book', bookSchema);
      var book = new Book({author: 34634634});
      var errors = book.validate(book.toObject());
      should.exist(errors);
      done();
    });

    it('setting options.type for schema forces a custom type name', function (done) {
      var schema = new app.Schema({author: String}, {type: 'CustomType'});
      var SomeModel = app.model('SomeModel', schema);
      SomeModel.model.should.have.property('type', 'CustomType');
      done();
    });

    it('invalidates a document with missing required field', function (done) {
      var cdSchema = new app.Schema({author: String, name: {type: String, required: true}});
      var CD = app.model('cd', cdSchema);
      var cd = new CD({author: 'Dr Dre'});
      var errors = cd.validate(cd.toObject());
      should.exist(errors);
      done();
    });

    it('it wont save a document with missing required field', function (done) {
      var Dog = app.model('Dog', new app.Schema({breed: String, required: true}));
      var dog = new Dog({breed: true});
      dog.save()
        .then(function (results) {
          done(new Error('The invalid document still saved, it should have thrown an error.'));
        })
        .catch(function (err) {
          done();
        });
    });
  });

});
