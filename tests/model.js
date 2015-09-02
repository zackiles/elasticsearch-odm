'use-strict';

var elasticsearch = require('../index.js');
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
      it('should save a new document', function(done){
        car.save().then(function(doc){
          doc.should.have.property('id');
          doc.should.have.property('createdOn');
          doc.should.have.property('updatedOn');
          doc.should.have.property('color', 'Blue');
          done();
        }).catch(done);
      });
    });

    describe('.update()', function(){
      it('should update an instance document', function(done){
        car.update({make:'Ford'}).then(function(doc){
          doc.should.have.property('color', 'Blue');
          doc.should.have.property('make', 'Ford');
          done();
        }).catch(done);
      });
    });

    describe('.remove()', function(){
      it('should remove an instance document', function(done){
        car.remove().then(function(doc){
          car.should.not.have.property('id');
          car.should.have.property('isInstance', false);
          car.should.have.property('isNew', true);
          done();
        }).catch(done);
      });
    });
  });

  describe('Static Methods', function(){
    describe('.count()', function(){
      it('should count all documents', function(done){
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
      it('should create a new document', function(done){
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
      it('should find a document by query', function(done){
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
      it('should find a document by query and remove it', function(done){
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
      it('should find a document by id', function(done){
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
});
