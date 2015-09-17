0.1.12 / 2015-09-17
===================
  * Fix undefined document on update with schema validation.

0.1.11 / 2015-09-16
===================
  * Fix not being able to match filters against arrays of values like `.find({tags: ['tag1', 'tag2']}`

0.1.10 / 2015-09-15
===================
  * Schema validation will now check the type of all elements in a native array.

0.1.9 / 2015-09-15
===================
  * .connect() now returns nothing instead of status() in order to speed up connections.
  * schemas now return a ValidationError object instead of array of errors. this is the same as mongoose.

0.1.8 / 2015-09-14
===================
  * Fix sort, page & per_page was not allowed for .findByIds() queries.

0.1.7 / 2015-09-13
===================
  * auto-escaper query String Queries 'q queryOption' according to elasticsearch standards.
  * fix toJSON for page reponse should return object.

0.1.6 / 2015-09-13
===================
  * ensure post hooks do not receive callbacks.
  * improve test coverage of model hooks.
  * update readme with more info on model hooks.

0.1.5 / 2015-09-13
===================
  * Fix improper promise being returned from .find() calls, errors weren't being caught properly.
  * Ensure .find() call resolved with an empty array when nothing is found.
  * Ensure .findById() rejects with an error when the id is not found.
  * Ensure .findByIds() resolves with an empty array when no ids are found.

0.1.4 / 2015-09-12
===================
  * Fix .toJSON() not retuning an object.

0.1.3 / 2015-09-11
===================
  * Fix issue with 'client' property in core not available/undefined.

0.1.2 / 2015-09-10
===================
  * Fix move PagedResponse prototype out of function call.

0.1.1 / 2015-09-9
===================
  * Remove error when q is used with match/must.
  * Fix connection error not throwing properly on bad connection.

0.1.0 / 2015-09-9
===================
  * Add schema pre/post hooks for model .save() and .remove().
  * Update readme with info on schema hooks.
