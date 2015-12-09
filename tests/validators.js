'use-strict';

var utils = require('../lib/utils'),
    should = require('should');


describe('Validators', function(){

  describe('.isISO8601()', function(){
    var isoDate = new Date().toISOString();
    it('valid', function(){
      utils.isISO8601(isoDate).should.equal(true);
    });
    it('invalid', function(){
       utils.isISO8601(Date.now()).should.equal(false);
    });
  });

  describe('.isFloat()', function(){

    it('valid', function(){
      utils.isFloat(4.44).should.equal(true);
      //utils.isFloat('4.44').should.equal(true);
    });
    /**
    it('invalid', function(){
      utils.isFloat(34).should.equal(false);
      utils.isFloat('34').should.equal(false);
      utils.isFloat(0).should.equal(false);
    });
     */
  });

  describe('.isLong()', function(){
    var long = 9223372036854775808;
    it('valid', function(){
      utils.isLong(long).should.equal(true);
    });
    it('invalid', function(){
      // i hate javascript, thats what it's + 2000
       utils.isLong(long + 2000).should.equal(false);
    });
  });

  describe('.isShort()', function(){
    var short = -32768;
    it('valid', function(){
      utils.isShort(short).should.equal(true);
    });
    it('invalid', function(){
       utils.isShort(short-1).should.equal(false);
    });
  });

  describe('.isByte()', function(){
    var byte = 127;
    it('valid', function(){
      utils.isByte(byte).should.equal(true);
    });
    it('invalid', function(){
       utils.isByte(byte+1).should.equal(false);
    });
  });

  describe('.isBase64()', function(){
    var base64 = 'aGhlbGxv';
    it('valid', function(){
      utils.isBase64(base64).should.equal(true);
    });
    it('invalid', function(){
       utils.isBase64(base64 + 'hello').should.equal(false);
    });
  });
});
