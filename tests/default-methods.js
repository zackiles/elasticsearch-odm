'use-strict';

var app = require('../index'),
    should = require('should');

var Book = app.model('Book');

describe('Default Methods', function(){

  before(function(done){
    this.timeout(10000);
    app.connect('esodm-test').then(function(){
      done();
    }).catch(done);
  });

  describe('.count()', function(){
    it('counts all documents', function(done){
      var book = new Book({color:'Red'});
      book.save()
      .then(function(){
        return Book.count();
      })
      .then(function(count){
        count.should.have.property('count').and.be.a.Number();
        return book.remove();
      })
      .then(function(){
        done();
      }).catch(done);
    });
  });

  describe('.create()', function(){
    it('creates a new document', function(done){
      Book.create({color:'Red'})
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
    this.timeout(10000);
    var book;
    before(function(done){
      book = new Book({
        name:'Gulliver\'s Travels',
        authors: [{
          name: 'Jonathan Swift'
        }]
      });
      book.save({refresh:true}).then(function(){
        done();
      }).catch(done);
    });
    it('finds a document by match query', function(done){
      Book.find({name: book.name})
      .then(function(results){
        results.should.be.instanceof(Array);
        results[0].should.have.property('name', book.name);
        done();
      })
      .catch(done);
    });
    it('finds a document using query chaining', function(done){
      Book.find()
      .sort('createdOn')
      .must({name: book.name})
      .then(function(results){
        results.should.be.instanceof(Array);
        results[0].should.have.property('name', book.name);
        done();
      })
      .catch(done);
    });
    it('returns empty array when nothing found', function(done){
      Book.find()
      .sort('createdOn')
      .must({name: Date.now().toString()})
      .then(function(results){
        results.should.be.instanceof(Array);
        should(results[0]).not.exist;
        done();
      })
      .catch(done)
    });
    after(function(done){
      book.remove().then(function(){
        done();
      }).catch(done);
    });
  });

  describe('.findAndRemove()', function(){
    it('finds a document by query and remove it', function(done){
      var book = new Book({name: 'Gulliver\'s Travels'});
      book.save()
      .then(function(doc){
        return Book.findAndRemove({name: doc.name});
      })
      .then(function(){
        done();
      }).catch(done);
    });
  });

  describe('.findById()', function(){
    it('finds a document by id', function(done){
      var book = new Book({color:'Red'});
      book.save()
      .then(function(doc){
        return Book.findById(doc.id);
      })
      .then(function(doc){
        doc.should.have.property('id', book.id);
        doc.should.have.property('color', 'Red');
        return doc.remove();
      })
      .then(function(){
        done();
      }).catch(done);
    });
    it('rejects the promise when the id is not found', function(done){
       Book.findById(Date.now().toString())
      .then(function(doc){
        done(new Error('Promise was not rejected.'));
      })
      .catch(function(err){
        err.should.be.instanceof(Error);
        done();
      });
    });
  });

  describe('.findByIds()', function(){
    it('finds documents by ids', function(done){
      this.timeout(5000);
      var book = new Book({name: 'Gulliver\'s Travels'});
      var book2 = new Book({name:'The Scarlet Letter'});
      book.save({refresh: true})
      .then(function(doc){
        return book2.save({refresh: true});
      })
      .then(function(doc){
        return Book.findByIds([book.id, book2.id]);
      })
      .then(function(results){
        results.should.be.instanceof(Array);
        should(results[0]).exist;
        results[0].should.have.property('name');
        should(results[1]).exist;
        results[1].should.have.property('name');
        done();
      }).catch(done);
    });
    it('returns an empty array when the ids are not found', function(done){
      Book.findByIds([Date.now().toString(), Date.now().toString()])
      .then(function(results){
        results.should.be.instanceof(Array);
        should(results[0]).not.exist;
        done();
      })
      .catch(function(err){
        done(new Error('Promise was not rejected. Should have resolved with empty array.'));
      });
    });
  });
});
