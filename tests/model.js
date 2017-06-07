'use-strict';

let requireNew = require('require-new'),
  app = requireNew('../index.js'),
  should = require('should'),
  helper = require('./helper');

let Car = app.model('car');
let car = new Car({color: 'Blue'});

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
      let Model1 = app.model('Mg3q5gherheh');
      let Model2 = app.model('Mg3q5gherheh');
      delete Model1.db;
      should.not.exist(Model2.db);
    });

    it('not_analyzed default mapping properties', function (done) {
      let typeName = 'nameTestType';
      let NameTestModel = app.model(typeName);

      let nameTest = new NameTestModel({name: 'test', test: 'another string'});
      nameTest.save()
        .then(function () {
          return helper.getMapping(app, typeName);
        })
        .then(function (mapping) {
          mapping.should.have.property('properties');
          // default mapping
          mapping.dynamic_templates.should.be.instanceof(Array);
          let first = mapping.dynamic_templates[0];
          first.should.have.property('string_fields');
          first.string_fields.should.have.property('mapping');
          first.string_fields.mapping.should.have.property('index', 'not_analyzed');

          done();
        })
        .catch(done);
    });

    it('not_analyzed default mapping properties with Schema', function (done) {
      let typeName = 'nameTestType2';
      let nameTestSchema = new app.Schema({
        name: 'keyword',
        test2: 'keyword'
      });
      let NameTestModel = app.model(typeName, nameTestSchema);

      let nameTest = new NameTestModel({name: 'test', test2: 'another string'});
      nameTest.save()
        .then(function () {
          return helper.getMapping(app, typeName);
        })
        .then(function (mapping) {
          mapping.should.have.property('properties');

          // default mapping
          mapping.dynamic_templates.should.be.instanceof(Array);
          let first = mapping.dynamic_templates[0];
          first.should.have.property('string_fields');
          first.string_fields.should.have.property('mapping');
          first.string_fields.mapping.should.have.property('index', 'not_analyzed');
          mapping.properties.test2.should.not.have.property('index');

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
      let setCar = new Car({color: 'Orange', type: 'Ford'});

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
    let bookSchema = new app.Schema({author: 'text'});

    it('creates a new model with schema', function (done) {
      let Book = app.model('Book', bookSchema);
      done();
    });

    it('creates an app mapping', function (done) {
      let Book = app.model('Book', bookSchema);
      let mapping = Book.toMapping();
      mapping.should.have.property(Book.model.type)
        .and.have.property('properties')
        .and.have.property('author')
        .and.have.property('type', 'text');
      done();
    });

    it('validates a good document', function (done) {
      let Book = app.model('Book', bookSchema);
      let book = new Book({author: 'Jim'});
      let errors = book.validate(book.toObject());
      should.not.exist(errors);
      done();
    });

    it('invalidates a document with wrong field type', function (done) {
      let Book = app.model('Book', bookSchema);
      let book = new Book({author: 34634634});
      let errors = book.validate(book.toObject());
      should.exist(errors);
      done();
    });

    it('setting options.type for schema forces a custom type name', function (done) {
      let schema = new app.Schema({author: 'text'}, {type: 'CustomType'});
      let SomeModel = app.model('SomeModel', schema);
      SomeModel.model.should.have.property('type', 'CustomType');
      done();
    });

    it('invalidates a document with missing required field', function (done) {
      let cdSchema = new app.Schema({author: 'keyword', name: {type: 'keyword', required: true}});
      let CD = app.model('cd', cdSchema);
      let cd = new CD({author: 'Dr Dre'});
      let errors = cd.validate(cd.toObject());
      should.exist(errors);
      done();
    });

    it('it wont save a document with missing required field', function (done) {
      let Dog = app.model('Dog', new app.Schema({breed: 'keyword', required: true}));
      let dog = new Dog({breed: true});
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
