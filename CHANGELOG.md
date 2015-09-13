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
