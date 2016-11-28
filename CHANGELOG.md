0.3.6 / 2016-11-27
==================
  * Update api version to 5.0
  * Update Elasticsearch lib
  
0.3.2 / 2016-07-05
==================
  * Add String/not_analyzed test

0.3.1 / 2016-07-03
==================
  * Update dependencies
  * Add tags for dependencies (david)
  * Add travis tests build & tags against node 4/5/6
  * Add .editorConfig to maintain same configuration across devs
  * Add examples on Readme
  * Merge default mapping & user mapping on connect()
  * Correct tests & add an test helper
  * Change result limit of find to 10k results instead of 999999
  * remove _id mapping (no longer configurable on es2.x)
  * merge b17 correction on constant_score typo error
  * Changes on Tests :
    - add an helper to connect, add, remove, delete index
    - add a consistent index creation/deletation by test
    - add requireNew dependecy to test connect/close
    - add connection/disconnection test
    - correction on model-consistency where promises where fired too soon and end of test was not concluant + lower test to 50 instead of 100 loops to limit testing time
    - add test on array length before testing element [0]
    - remove after on query-promise, replace by helper index deletation
  * Changes on lib :
    - add disconnect() function to close  elasticsearch connection
    - change Readme.md to replace 'elasticsearch.' to 'esodm' for elasticsearch-odm reference
    - update apiVersion to 2.3
    - use options to override default mapping & settings in elasticsearch  when connecting
    - add trace option on elasticsearch connection
    - reformat code (beautifier based on editorConfig)
    - update dev dependencies to should v7.1 to 9.0.2

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
