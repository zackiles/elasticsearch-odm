'use-strict';

var utils = require('../lib/utils');


describe('Validators', function(){

  describe('.isISO8601()', function(){
    var isoDate = new Date().toISOString();
    it('shows valid', function(done){
      utils.isISO8601(isoDate).should.equal(true);
      done();
    });
    it('shows invalid', function(done){
       utils.isISO8601(Date.now()).should.equal(false);
       done();
    });
  });

  describe('.isFloat()', function(){

    it('shows valid', function(done){
      utils.isFloat(4.44).should.equal(true);
      utils.isFloat('4.44').should.equal(true);
      done();
    });
    it('shows invalid', function(done){
       utils.isFloat(34).should.equal(false);
       utils.isFloat('34').should.equal(false);
       utils.isFloat(0).should.equal(false);
       done();
    });
  });


  describe('.isLong()', function(){
    var long = 9223372036854775808;
    it('shows valid', function(done){
      utils.isLong(long).should.equal(true);
      done();
    });
    it('shows invalid', function(done){
      // i hate javascript, thats what it's + 2000
       utils.isLong(long + 2000).should.equal(false);
       done();
    });
  });

  describe('.isShort()', function(){
    var short = -32768;
    it('shows valid', function(done){
      utils.isShort(short).should.equal(true);
      done();
    });
    it('shows invalid', function(done){
       utils.isShort(short-1).should.equal(false);
       done();
    });
  });

  describe('.isByte()', function(){
    var byte = 127;
    it('shows valid', function(done){
      utils.isByte(byte).should.equal(true);
      done();
    });
    it('shows invalid', function(done){
       utils.isByte(byte+1).should.equal(false);
       done();
    });
  });

  describe('.isBase64()', function(){
    var base64 = 'aGhlbGxv';
    it('shows valid', function(done){
      utils.isBase64(base64).should.equal(true);
      done();
    });
    it('shows invalid', function(done){
       utils.isBase64(base64 + 'hello').should.equal(false);
       done();
    });
  });
});
