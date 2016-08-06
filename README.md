Elasticsearch ODM
=========

[![Join the chat at https://gitter.im/bloublou2014/elasticsearch-odm](https://badges.gitter.im/bloublou2014/elasticsearch-odm.svg)](https://gitter.im/bloublou2014/elasticsearch-odm?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![npm version](https://badge.fury.io/js/elasticsearch-odm-2.svg)](http://badge.fury.io/js/elasticsearch-odm-2)
[![Build Status](https://travis-ci.org/bloublou2014/elasticsearch-odm.svg?branch=es-2.x)](https://travis-ci.org/bloublou2014/elasticsearch-odm)
[![Dependency Status](https://david-dm.org/bloublou2014/elasticsearch-odm/es-2.x.svg)](https://david-dm.org/bloublou2014/elasticsearch-odm/es-2.x)
[![Dev Dependency Status](https://david-dm.org/bloublou2014/elasticsearch-odm/es-2.x/dev-status.svg)](https://david-dm.org/bloublou2014/elasticsearch-odm/es-2.x#info=devDependencies)

***Like Mongoose but for Elasticsearch.*** Define models, preform CRUD operations, and build advanced search queries. Most commands and functionality that exist in Mongoose exist in this library. All asynchronous functions use Bluebird Promises instead of callbacks.

This is currently the only ODM/ORM library that exists for Elasticsearch on Node.js. [Waterline](https://github.com/balderdashy/waterline) has a [plugin](https://github.com/UsabilityDynamics/node-waterline-elasticsearch) for Elasticsearch but it is incomplete and doesn't exactly harness it's searching power.
[Loopback](https://github.com/strongloop/loopback) has a storage [plugin](https://github.com/drakerian/loopback-connector-elastic-search), but it also doesn't focus on important parts of Elasticsearch, such as mappings and efficient queries. This library automatically handles merging and updating Elasticsearch mappings based on your schema definition.

### Installation

If you currently have [npm elasticsearch](https://www.npmjs.com/package/elasticsearch) installed, you can remove it and access it from [client](client---elasticsearch) in this library if you still need it.

```sh
$ npm install elasticsearch-odm-2
```

### Features
- Easy to use API that mimics Mongoose, but cuts out the extras.
- Models, Schemas and Elasticsearch specific type mapping.
- Add Elasticsearch specific type options to your [Schema](#schemas), like boost, analyzer or score.
- Utilizes bulk and scroll features from Elasticsearch when needed.
- Easy [search queries](#query-options) without generating your own DSL.
- Seamlessly handles updating your Elasticsearch mappings based off your models [Schema](#schemas).

### Quick Start
You'll find the API is intuitive if you've used Mongoose or Waterline.

Example (no schema):

```js
var esodm = require('elasticsearch-odm-2');
var Car = esodm.model('Car');
var car = new Car({
  type: 'Ford', color: 'Black'
});
esodm.connect('my-index').then(function(){
  // be sure to call connect before bootstrapping your app.
  car.save().then(function(document){
    console.log(document);
  });
});
```
Example (using a [schema](#schemas)):

```js
var esodm = require('elasticsearch-odm-2');
var carSchema = new esodm.Schema({
  type: String,
  color: {type: String, required: true}
});
var Car = esodm.model('Car', carSchema);
```
## API Reference
- [Core](#core)
  - [`.connect(String/Object options)`](#connectstringobject-options---promise)
  - [`.disconnect()`](#disconnect---promise)
  - [`new Schema(Object options)`](#new-schemaobject-options---schema)
  - [`.model(String modelName)`](#modelstring-modelname-optionalschema-schema---model)
  - [`.client`](#client---elasticsearch)
  - [`.stats()`](#stats)
  - [`.createIndex(String index, Object mappings)`](#createindexstring-index-object-mappings)
  - [`.removeIndex(String index)`](#removeindexstring-index)
- [Document](#document)
  - [`.save()`](#save---document)
  - [`.remove()`](#remove)
  - [`.update(Object data)`](#updateobject-data---document)
  - [`.set(Object data)`](#setobject-data---document)
  - [`.toObject()`](#toobject)
- [Model](#model)
  - [`.count()`](#count---object)
  - [`.create(Object data)`](#createobject-data---document)
  - [`.update(String id, Object data)`](#updatestring-id-object-data---document)
  - [`.remove(String id)`](#removestring-id)
  - [`.removeByIds(Array ids)`](#removebyidsarray-id)
  - [`.set(String id)`](#setstring-id-object-data---document)
  - [`.find(Object/String match, Object queryOptions)`](#findobjectstring-match-object-queryoptions---document)
  - [`.findById(String id, Object queryOptions)`](#findbyidstring-id-object-queryoptions---document)
  - [`.findByIds(Array ids, Object queryOptions)`](#findbyidsarray-ids-object-queryoptions---document)
  - [`.findOne(Object/String match, Object queryOptions)`](#findoneobjectstring-match-object-queryoptions---document)
  - [`.findAndRemove(Object/String match, Object queryOptions)`](#findandremoveobjectstring-match-object-queryoptions---object)
  - [`.findOneAndRemove(Object/String match, Object queryOptions)`](#findoneandremoveobjectstring-match-object-queryoptions---object)
  - [`.makeInstance(Object data)`](#makeinstanceobject-data---document)
  - [`.toMapping()`](#tomapping)
- [Query Options](#query-options)
  - [`page & per_page`](#page--per_page)
  - [`fields`](#fields)
  - [`sort`](#sort)
  - [`q`](#q)
  - [`must`](#must)
  - [`not`](#mot)
  - [`missing`](#missing)
  - [`exists`](#exists)
- [Schemas](#schemas)
  - [`Hooks and Middleware`](#hooks-and-middleware)
  - [`Static and Instance Methods`](#static-and-instance-methods)

### Core
Core methods can be called directly on the Elasticsearch ODM instance. These include methods to configure, connect, and get information from your Elasticsearch database. Most methods act upon the [official Elasticsearch client](https://www.npmjs.com/package/elasticsearch).

##### `.connect(String/Object options)` -> `Promise`
Returns a promise that is resolved when the connection is complete. Can be passed a single index name, or a full configuration object. The default host is localhost:9200 when no host is provided, or just an index name is used.
This method should be called at the start of your application.

***If the index name does not exist, it is automatically created for you.***

*You can also add any of the [Elasticsearch specific options](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/configuration.html), like SSL configs.*

Example:

```js
// when bootstrapping your application
var esodm = require('elasticsearch-odm-2');

esodm.connect({
  host: 'localhost:9200',
  index: 'my-index',
  logging: false, // true by default when NODE_ENV=development
  trace: true, // true for elasticsearch default trace logs
  ssl: {
    ca: fs.readFileSync('./cacert.pem'),
    rejectUnauthorized: true
  },
  options : { // optional index settings & mappings. Override default mappings
    settings: {
      index: {
        number_of_shards: 1,
        number_of_replicas: 0
      }
    }
  }
});
// OR
esodm.connect('my-index'); // default host localhost:9200
```


##### `.disconnect()` -> `Promise`
Returns a promise that is resolved when the disconnection is complete.
This method should be called to close elasticsearch connection.

Example:

```js
// when bootstrapping your application
var esodm = require('elasticsearch-odm-2');

esodm.connect('my-index')
  .then(function(){
    // ... code here
  })
  .then(esodm.disconnect)
  .then(function(){
    console.log('disconnected');
  });
```

##### `new Schema(Object options)` -> `Schema`
Returns a new schema definition to be used for models.

##### `.model(String modelName, Optional/Schema schema)` -> `Model`
Creates and returns a new Model, like calling Mongoose.model(). Takes a type name, in mongodb this is also known as the collection name. This is global function and adds the model to Elasticsearch ODM instance.

##### `.client` -> `Elasticsearch`
The raw instance to the underlying [Elasticsearch](https://www.npmjs.com/package/elasticsearch) client. Not really needed, but it's there if you need it, for example to run queries that aren't provided by this library.

##### `.stats()`
Returns a promise that is resolved with [index stats](https://www.elastic.co/guide/en/elasticsearch/reference/1.6/indices-stats.html) for the current Elasticsearch connections.

##### `.removeIndex(String index)`
Takes an index name, and complete destroys the index. Resolves the promise when it's complete.

##### `.createIndex(String index, Object mappings)`
Takes an index name, and a json string or object representing your [mapping](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html).
Resolves the promise when it's complete.

### Document
Like Mongoose, instances of models are considered documents, and are returned from calls like find() & create(). Documents include the following functions to make working with them easier.

##### `.save()` -> `Document`
Saves or updates the document. If it doesn't exist it is created. Like Mongoose, Elasticsearches internal '_id' is copied to 'id' for you. If you'd like to force a custom id, you can set the id property to something before calling save(). Every document gets a createdOn and updatedOn property set with ISO-8601 formatted time.

Note : In order to access document just after insertion you must add `{refresh: true}` as `save()` parameter. See [index.refresh_interval](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html#dynamic-index-settings). Force refresh has a negative impact on elasticsearch, but depending on your use it can be mandatory. 

Example :
```js
var esodm = require('elasticsearch-odm-2');
var Car = esodm.model('Car');
var car = new Car({
  type: 'Ford', color: 'Black'
});
esodm.connect('my-index').then(function(){
  // be sure to call connect before bootstrapping your app.
  car
    .save({refresh: true}) // Save document and request Elasticsearch to refresh shard
    .then(function(document){
      console.log(document);
     });
});
```

##### `.remove()`
Removes the document and destroys the cuurrent document instance. No value is resolved, and missing documents are ignored.

##### `.update(Object data)` -> `Document`
Partially updates the document. Data passed will be merged with the document, and the updated version will be returned. This also sets the current model instance with the new document.

##### `.set(Object data)` -> `Document`
Completely overwrites the document with the data passed, and returns the new document. This also sets the current model instance with the new document.

*Will remove any fields in the document that aren't passed.*

##### `.toObject()`
Like Mongoose, strips all non-document properties from the instance and returns a raw object.

### Model
Model definitions returned from .model() in core include several static functions to help query and manage documents. Most functions are similar to Mongoose, but due to the differences in Elasticsearch, querying includes some extra advanced features.

##### `.count()` -> `Object`
Object returned includes a 'count' property with the number of documents for this Model (also known as _type in Elasticsearch). See [Elasticsearch count](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-count.html).

##### `.create(Object data)` -> `Document`
A helper function. Similar to calling new Model(data).save(). Takes an object, and returns the new document.

##### `.update(String id, Object data)` -> `Document`
A helper function. Similar to calling new Model().update(data). Takes an id and a partial object to update the document with.

##### `.remove(String id)`
Removes the document by it's id. No value is resolved, and missing documents are ignored.

##### `.removeByIds(Array ids)`
Help function, see remove. Takes an array of ids.

##### `.set(String id, Object data)` -> `Document`
Completely overwrites the document matching the id with the data passed, and returns the new document.

*Will remove any fields in the document that aren't passed.*

##### `.find(Object/String match, Object queryOptions)` -> `Document`
There are four ways to call .find() and it's siblings. You can mix and match styles.
- Passing only a match object like `.find({name:'Joe'})`
- Passing only a string to match against all document fields `.find('some string')`
- Passing [Query Options](#query-options) (match can be set to null/empty) `.find({}, {must: {active: true, sort: 'createdOn'}}}`
- Use chaining options (alias for QueryOptions) `.find({}).must({active: true}).sort('createdOn').then(..)`

note : current version support up to 10000 results due to elasticsearch default limitations.

Unlike mongoose, finding exact matches requires the fields in your mapping to be set to 'not_analyzed'. By default `{index: not_analyzed}` is added to all string fields in your Schema unless you override it.
*Depending on the [analyzer](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-analyzers.html) in your [mapping](https://www.elastic.co/guide/en/elasticsearch/guide/current/mapping-intro.html), find queries like must, not, and matches may not find any results.*

match => Optional. An alias for the 'must' Query Option.  Like Mongoose this matches name/value in documents. Also, instead of an object, just a string can be passed which will match against all document fields using the power of an Elasticsearch [QueryStringQuery](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html).

queryOptions => Optional (can also use chaining instead). An object with Query Options. Here you can specifiy paging, filtering, sorting and other advanced options. [See here for more details](#query-options). You can set the first argument to null, and only use filters from the query options if you wanted.

returns => Found documents, or null if nothing was found.

Example:

```js
var Car = esodm.model('Car');

// Simple query.
Car.find({color: 'blue'}).then(function(results){
  console.log(results);
});

// Nested query (for nested documents/properties).
Car.find({'location.city': 'New York'})

// Find all by passing null or empty object to first argument
Car.find(null, {sort: 'createdOn'})

// Search all fields using a QueryStringQuery.
Car.find('some text')

// Chained query without using Query Options.
// Instead of Mongoose .exec(), we call .then()
Car.find()
.must({color: 'blue'})
.exists('owner')
.sort('createdOn')
.then(...)

```
##### `.findById(String id, Object queryOptions)` -> `Document`
Finds a document by id. 'fields' argument is optional and specifies the fields of the document you'd like to include.

##### `.findByIds(Array ids, Object queryOptions)` -> `Document`
Same as .findById() but for multiple documents.

##### `.findOne(Object/String match, Object queryOptions)` -> `Document`
Same arguments as .find(). Returns the first matching document.

##### `.findAndRemove(Object/String match, Object queryOptions)` -> 'Object'
Same arguments as .find(). Removes all matching documents and returns their raw objects.

##### `.findOneAndRemove(Object/String match, Object queryOptions)` -> 'Object'
Same arguments as .findAndRemove(). Removes the first found document.

##### `.makeInstance(Object data)` -> `Document`
Helper function. Takes a raw object and creates a document instance out of it. The object would need at least an id property. The document returned can be used normally as if it were returned from other calls like .find().

##### `.toMapping()`
Returns a complete Elasticsearch mapping for this model based off it's schema. If no schema was used, it returns nothing. Used internally, but it's there if you'd like it.

### Query Options
The query options object includes several options that are normally included in mongoose chained queries, like sort, and paging (skip/limit), and also some advanced features from Elasticsearch.
The Elasticsearch [Query](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html) and [Filter](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-filters.html) DSL is generated using best practices.

##### page & per_page
Type: `Integer`

For most use cases, paging is better suited than skip/limit, so this library includes thhis instead. Page 0/1 are the same thing, so either can be used. Page and per_page both use default when the other is set, page defaults to the first, and per_page defaults to 10.

*Including page or per_page will result in the response being wrapped in a meta data object like the following. You can call toJSON and toObject on this response and it'll call that method on all document instances under the hits property.*

```js
// A paged response that is returned when page or per_page is set.
{
  total: 0, // total documents found for the query.
  hits: [], // a collection of document instances.
  page: 0, // current page requested.
  pages: 0 // total number of pages.
}
```

##### fields
Type: `Array or String`

A list of fields to include in the documents returned. For example, you could pass 'id' to only return the matching document id's. See [Elasticsearch Fields](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-fields.html).

```js
// Query Options.
{
  fields: ['name', 'age']
}

// Chained Query.
.find()
.fields(['name', 'age'])
.then(...)
```

##### sort
Type: `Array or String`

A list of fields to sort on. If multiple fields are passed then they are executed in order. Adding a '-' sign to the start of the field name makes it sort descending. Default is ascending. See [Elasticsearch Sort](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-sort.html).

Example:

```js
// Query Options.
{
  sort: ['name', 'createdOn']
}

// Chained Query.
.find()
.sort(['name', 'createdOn'])
.then(...)
```

##### q
Type: `String`

A string to search all document fields with using Elasticsearch [QueryStringQuery](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html). This can be expensive, so use it sparingly.

Example:

```js
// Query Options.
{
  q: 'Red dog run'
}

// Chained Query.
.find('Red dog run')
.then(...)
```

##### must
Type: `Object`

Key value pairs to match documents against. Essentially it's the same as first argument passed to Mongoose .find(). This is also an alias to the first argument passed to .find() in this library.
This is a 'must' [Bool Filter](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-filter.html).

***Elasticsearches internal [Tokenizers](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-tokenizers.html) are used, and fields are analyzed.***

*You can query nested fields using dot notation.*

Example:

```js
// Query Options.
{
  must: {
    name: 'Jim',
    'location.country': 'Canada'
  }
}

// Chained Query.
.find()
.must({name: 'Jim', 'location.country': 'Canada'})
.then(...)
```
##### not
Type: `Object`

The same as [must](#must), but matches documents where the key value pairs DON'T match.
This is a 'must_not' [Bool Filter](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-filter.html) query.

*You can query nested fields using dot notation.*

Example:

```js
// Query Options.
{
  not: {
    name: 'Jim',
    'location.country': 'Canada'
  }
}

// Chained Query.
.find()
.not({name: 'Jim', 'location.country': 'Canada'})
.then(...)
```
##### missing
Type: `Array or String`

A single field name, or array of field names. Matches documents where these field names are missing. A field is considered mising, when it is null, empty, or does not exist. See [MissingFilter]
(https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-missing-filter.html).

Example:

```js
// Query Options.
{
  missing: ['description', 'name']
}

// Chained Query.
.find()
.missing(['description', 'name'])
.then(...)
```
##### exists
Type: `Array or String`

A single field name, or array of field names. Matches documents where these field names exists. The opposite of [missing](#missing).

Example:

```js
// Query Options.
{
  exists: ['description', 'name']
}

// Chained Query.
.find()
.exists(['description', 'name'])
.then(...)
```

### Schemas
Models don't require schemas, but it's best to use them - especially if you'll be making search queries. Elasticsearch-odm will generate and update Elasticsearch with the proper mappings based off your schema definition.
The schemas are similar to Mongoose, but several new field types have been added which Elasticsearch supports. These are; **float**, **double**, **long**, **short**, **byte**, **binary**, **geo_point**. Generally for numbers, only the Number type is needed (which converts to Elasticsearch integer). You can read more about Elasticsearch types [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-core-types.htm).

***NOTE***

- Types can be defined in several ways. The regular mongoose types exist, or you can use the actual type names Elasticsearch uses.
- You can also add any of the field options you see for [Elasticsearch Core Types](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-core-types.html)
- String types will default to `"index": "not_analyzed"`. See [Custom Field Mappings](https://www.elastic.co/guide/en/elasticsearch/guide/current/mapping-intro.html#custom-field-mappings). This is so the .find() call acts like it does in Mongoose by only fidning exact matches, however, this prevents the ability to do full text search on this field. Simply set `{"index":"analyzed"}` if you'd like full text search instead.

Example:
```js
// Before saving a document with this schema, your Elasticsearch
// mappings will automatically be updated.

// Note the various ways you can define a schema field type.
var carSchema = new esodm.Schema({
  // native type without options
  available: Boolean,
  // Elasticsearch type without options
  safteyRating: 'float',
  // native array type
  parts: [String],
  // Elasticsearch array type
  oldPrices: {type: ['double']},
  // with options
  color: {type: String, required: true},
  // a field named 'type' must be defined like the following.
  type: {type: String},
  // nested document
  owner: {
    name: String,
    age: Number,
    // force a required field
    location: {type: 'geo_point', required: true}
  },
  // nested document array
  inspections: [{
    date: Date,
    grade: Number
  }],
  // Enable full-text search of this field.
  // NOTE: it's better to than use the 'q' paramater in queryOptions
  // during searches instead of must/not or match when using 'analyzed'
  description: {type:String, index: 'analyzed'}

  // Ignore_malformed is an Elasticsearch Core Type field option for numbers
  price: {type: 'double', ignore_malformed: true}
});
```
#### Hooks and Middleware
Schemas include pre and post hooks that function similar to Mongoose. Currently, there are pre/post hooks for 'save' and 'remove'.

**Pre Hooks**

Same conventions as Mongoose. Function takes a done() callback that must be called when your function is finished. `this` is scoped to the current document. assing an Error to done() will cancel the current operation. For example, in a pre 'save' hook, passing an error to done() will cause the document not to be saved and will return your error to the save() callers rejection handler.

```js
var schema = new esodm.Schema(...);
schema.pre('save', function(done){
  console.log(this); // this = the current document
  done(); // OR done(new Error('bad document'));
});
```

**Post Hooks**

Same conventions as Mongoose. Does not have a done() callback. Executed after the hooked method. The first argument is the current document which may or may not be a document instance (eg. post remove only receives the raw object as the document no longer exists).

```js
var schema = new esodm.Schema(...);
schema.post('remove', function(document){
  console.log(document);
});
```

#### Static and Instance Methods

Add methods to your schema with the same convention as Mongoose.

```js
// Instance method.
var schema = new esodm.Schema(...);

schema.methods.getFullName = function(){
  return this.firstName + ' ' + this.lastName;
});

// Static method.
schema.statics.findByColor = function(color){
  return this.find({color: color});
});
```

### CHANGLELOG
[See here.](https://github.com/zackiles/elasticsearch-odm/blob/master/CHANGELOG.md)

### CONTRIBUTING
This is a library Elasticsearch desperately needed for Node.js. Currently the official npm [elasticsearch](https://www.npmjs.com/package/elasticsearch) client has about 23,000 downloads per week, many of them would benefit from this library instead. Pull requests are welcome. There are [Mocha](https://github.com/mochajs/mocha) and [benchmark](https://www.npmjs.com/package/benchmark) tests in the root directory.

### TODO
- Browser build.
- Add support for [querying nested document arrays](https://www.elastic.co/guide/en/elasticsearch/guide/current/nested-query.html) with dot notation syntax.
- Add [scrolling](https://www.elastic.co/guide/en/elasticsearch/reference/1.6/search-request-scroll.html)
- Add a wrapper to enable streaming of document results.
- Add [snapshots/backups](https://www.elastic.co/guide/en/elasticsearch/reference/1.6/modules-snapshots.html)
- Allow methods to call Elasticsearch facets.
- Performance tweak application, fix garbage collection issues, and do benchmark tests.
- Integrate npm 'friendly' for use with expanding/collapsing parent/child documents.
- Use [source filtering](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-get.html#get-source-filtering) instead of fields.

Elasticsearch 2.x :
- Find requests : use scroll api in order to get more than 10000 results if needed
