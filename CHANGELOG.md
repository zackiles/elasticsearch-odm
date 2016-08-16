1.1.0 / 2016-08-21
===================
  * Add connect option 'syncMapping' to enabled/disable automatic shcema->elasticsearch put mappings. syncMapping is true by default.

1.0.0 / 2016-08-13
===================
  * Changed default Number type in schema to be elasticsearch long instead of integer to match elasticsearch defaults for dynamic mapping (JSON integers are long by default)

0.3.1 / 2016-08-12
===================
  * Fixed an issue relating to constant_score queries.
  * Temp workaround for float/double validator not accepting numbers without decimals.
  * Fixed an edge case for connection issues.

0.3.0 / 2015-11-25
===================
  * Add schema static and instance methods.

0.2.0 / 2015-11-21
===================
  * Lazy update elasticsearch mappings (generated from schemas) on initialization. set ignore_conflicts=true to avoid breaking changes. note: you can not change the type after it is already mapped, this means no changing the type of a property in your schema definitions.
  * Remove store property from default mappings.

0.1.13 / 2015-09-23
===================
  * Fix missing PagedResponse when no results exist.

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
  * Schemas now return a ValidationError object instead of array of errors. this is the same as mongoose.

0.1.8 / 2015-09-14
===================
  * Fix sort, page & per_page was not allowed for .findByIds() queries.

0.1.7 / 2015-09-13
===================
  * Auto-escaper query String Queries 'q queryOption' according to elasticsearch standards.
  * Fix toJSON for page reponse should return object.

0.1.6 / 2015-09-13
===================
  * Ensure post hooks do not receive callbacks.
  * Improve test coverage of model hooks.
  * Update readme with more info on model hooks.

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
