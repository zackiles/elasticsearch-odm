Elasticsearch ODM
=========
[![npm version](https://badge.fury.io/js/elasticsearch-odm.svg)](http://badge.fury.io/js/elasticsearch-odm)

***Like Mongoose but for Elasticsearch.*** Define models, preform CRUD operations, and build advanced search queries. Most commands and functionality that exist in Mongoose exist in this package. All asynchronous functions use Bluebird Promises instead of callbacks.

This is currently the *only* ODM/ORM library that exists for Elasticsearch on Nodejs. [Waterline](https://github.com/balderdashy/waterline) has a [plugin](https://github.com/UsabilityDynamics/node-waterline-elasticsearch) for Elasticsearch but it is very incomplete and hasn't been updated for years. This library has been battle tested for several years in production, but does require care to configure.

### Use Case
- You need an easy and lightweight abstraction for working with elasticsearch.
- You are used to libraries like Mongoose, or Waterline.
- You're doing mostly CRUD operations, but still want the power to run advanced queries provided by Elasticsearch.
- You'd like one library to handle everything, from the connection, to modelling, to building query & filter DSL.
- You'd like to easily manage parent/child relationships between Elasticsearch documents.

### Quick Start
You'll find the API is intuitive if you've used Mongoose or Waterline.

Example:

```js
var elasticsearch = require('elasticsearch-odm');
var Car = elasticsearch.model('Car');

elasticsearch.connect('my-index').then(function(){

  var car = new Car({
    type: 'Ford', color: 'Black'
  });
  car.save().then(function(document){
    console.log(document);
  });
});
```

### API Reference
- [Core](#core)
  - [`.connect(String/Object options)`](#connectstringobject-options---promise)
  - [`.model(String type)`](#modelstring-type---model)
  - [`.client`](#client---elasticsearch)
- [Document](#document)
  - [`.save()`](#save---document)
  - [`.remove()`](#remove)
  - [`.update(Object data)`](#updateobject-data---document)
  - [`.set(Object data)`](#setobject-data---document)
  - [`.toJSON()`](#tojson)
  - [`.toObject()`](#toobject)
- [Model](#model)
  - [`.count()`](#count---object)
  - [`.create(Object data)`](#createobject-data---document)
  - [`.uodate(String id, Object data)`](#updatestring-id-object-data---document)
  - [`.remove(String id)`](#removestring-id)
  - [`.set(String id)`](#setstring-id-object-data---document)
  - [`.find(Object/String match, Object queryOptions)`](#findobjectstring-match-object-queryoptions---document)
  - [`.search(Object queryOptions)`](#searchobject-queryoptions---document)
  - [`.findById(String id, Array/String fields)`](#findbyidstring-id-arraystring-fields---document)
  - [`.findByIds(Array ids, Array/String fields)`](#findbyidsarray-ids-arraystring-fields---document)
  - [`.findOne(Object/String match, Array/String fields)`](#findoneobjectstring-match-arraystring-fields---document)
  - [`.findOneAndRemove(Object/String match)`](#findoneandremoveobjectstring-match---document)
  - [`.findAndRemove(Object/String match)`](#findandremoveobjectstring-match)
  - [`.makeInstance(Object data)`](#makeinstanceobject-data---document)
- [Query Options](#query-options)
  - [`q`](#q)
  - [`page & per_page`](#page--per_page)
  - [`fields`](#fields)
  - [`sort`](#sort)
  - [`must`](#must)
  - [`not`](#mot)
  - [`random`](#random)

#### Core
Core methods can be called directly on the Elasticsearch ODM instance. These include methods to configure, connect, and get information from your Elasticsearch database. Most methods act upon the [official Elasticsearch client](https://www.npmjs.com/package/elasticsearch).

##### `.connect(String/Object options)` -> `Promise`
Can be passed a single index name, or a full configuration object. The default host is localhost:9200 when no host is provided. Once connected, this connection is shared with all Elasticsearch ODM instances, so it only has to be called once.

Example:

```js
// when bootstrapping your application
var elasticsearch = require('elasticsearch-odm');

elasticsearch.connect({
  host: 'localhost:9200',
  index: 'my-index'
});
// OR
elasticsearch.connect('my-index'); // default host localhost:9200
```
##### `.model(String type)` -> `Model`
Creates and returns a new Model, like calling Mongoose.model(). Takes a type name, in mongodb this is also known as the collection name. This is global function and adds the model to Elasticsearch ODM instance.

##### `.client` -> `Elasticsearch`
The raw instance to the underlying [Elasticsearch](https://www.npmjs.com/package/elasticsearch) client. Not really needed, but it's there if you need it, for example to run queries that aren't provided by this library.

#### Document
Like Mongoose, instances of models are considered documents, and are returned from calls like find() & create(). Documents include the following functions to make working with them easier.

##### `.save()` -> `Document`
Saves or updates the document. If it doesn't exist it is created. Like Mongoose, Elasticsearches internal '_id' is copied to 'id' for you. If you'd like to force a custom id, you can set the id property to something before calling save(). Every document gets a createdOn and updatedOn property set with ISO-8601 formatted time.

##### `.remove()`
Removes the document and destroys the cuurrent document instance. No value is resolved, and missing documents are ignored.

##### `.update(Object data)` -> `Document`
Partially updates the document. Data passed will be merged with the document, and the updated version will be returned. This also sets the current model instance with the new document.

##### `.set(Object data)` -> `Document`
Completely overwrites the document with the data passed, and returns the new document. This also sets the current model instance with the new document.

*Will remove any fields in the document that aren't passed.*

##### `.toJSON()`
Like Mongoose, strips all non-document properties from the instance and returns a JSON string.

##### `.toObject()`
Like Mongoose, strips all non-document properties from the instance and returns an object.

#### Model
Model definitions returned from .model() in core include several static functions to help query and manage documents. Most functions are similar to Mongoose, but due to the differences in Elasticsearch, querying includes some extra advanced features.

##### `.count()` -> `Object`
Object returned includes a 'count' property with the number of documents for this Model (also known as _type in Elasticsearch). See [Elasticsearch count](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-count.html).

##### `.create(Object data)` -> `Document`
A helper function. Similar to calling new Model(data).save(). Takes an object, and returns the new document.

##### `.update(String id, Object data)` -> `Document`
A helper function. Similar to calling new Model().update(data). Takes an id and a partial object to update the document with.

##### `.remove(String id)`
Removes the document by it's id. No value is resolved, and missing documents are ignored.

##### `.set(String id, Object data)` -> `Document`
Completely overwrites the document matching the id with the data passed, and returns the new document.

*Will remove any fields in the document that aren't passed.*

##### `.find(Object/String match, Object queryOptions)` -> `Document`
Unlike mongoose, searching for exact matches requires the fields in your mapping to be set to 'not_analyzed'.
*Depending on the [analyzer](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-analyzers.html) in your [mapping](https://www.elastic.co/guide/en/elasticsearch/guide/current/mapping-intro.html),  this method may produce varying results.*

Like Mongoose the first paramter can be an object with properties and values to match a document with. Also, instead of an object, just a string can be passed which will match against all documents using the power of an Elasticsearch [QueryStringQuery](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html).

*the match object can also be set to null for find all*

The second optional argument is an object with Query Options. Here you can specifiy paging, filtering, sorting and other advanced elasticsearch queries. [See here for more details](#query-options). You can set the first argument to null, and only use filters from the query options if you wanted.

Example:

```js
var Car = elasticsearch.model('Car');

// Simple query.
Car.find({color: 'blue'}).then(function(results){
  console.log(results);
});

// Advanced query.
Car.find({color: 'blue'}, {sort: ['name', 'createdOn'}).then(function(results){
  console.log(results);
});

// Advanced query using only filters.
// Returns all cars that arent red, and sorts by name, then createdOn.
var mustNotFilter = {
  color: 'red',
};
Car.find(null, {not: mustNotFilter, sort: ['name', 'createdOn'}}).then(function(results){
  console.log(results);
});
```
##### `.search(Object queryOptions)` -> `Document`
Helper function. Just calls .find() without the first paramter. The first paramater is technically only a 'must' filter, so if you still need that ability set the 'must' paramter like you would the first argument of .find(). All see [Query Options](#query-options).

##### `.findById(String id, Array/String fields)` -> `Document`
Finds a document by id. 'fields' argument is optional and specifies the fields of the document you'd like to include.

##### `.findByIds(Array ids, Array/String fields)` -> `Document`
Helper function. Same as .findById() but for multiple documents.

##### `.findOne(Object/String match, Array/String fields)` -> `Document`
First argument is the same as .find(). Second argument is a list of fields to include instead of query options and it only returns the first document matching. This is similar to using the 'must' query option.

##### `.findOneAndRemove(Object/String match)`
First argument is the same as .findOne(). Removes a single matching document.

##### `.findAndRemove(Object/String match)`
First argument is the same as .find(). Removes all matching documents and returns nothing even with no matches.

##### `.makeInstance(Object data)` -> `Document`
Helper function. Takes a raw object and creates a document instance out of it. The object would need at least an id property. The document returned can be used normally as if it were returned from other calls like .find().

### Query Options
The query options object includes several options that are normally included in mongoose chained queries, like sort, and paging (skip/limit), and also some advanced features from Elasticsearch.
The Elasticsearch [Query](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html) and [Filter](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-filters.html) DSL is generated using best practices.

##### q
Type: `String`

A string to search all document fields with using Elasticsearch [QueryStringQuery](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html). This can be expensive, so use it sparingly.

*Depending on your Elasticsearch version, you might not be able to combine this with not/must filters*

##### page & per_page
Type: `Integer`

For most use cases, paging is better suited than skip/limit, so this library includes thhis instead. Page 0/1 are the same thing, so either can be used. Page and per_page both use default when the other is set, page defaults to the first, and per_page defaults to 10.

*Including page or per_page will result in the response being wrapped in a meta data object like the following. You can call toJSON and toObject on this response and it'll call that method on all document instances under the hits property.*

```js
{
  total: 0, // total documents found for the query.
  hits: [], // a collection of document instances.
  page: 0, // current page requested.
  pages: 0 // total number of pages.
}
```

##### fields
Type: `Array or String`

A list of fields to include for the documents returned. For example, you could pass 'id' to only return the matching document id's.

##### sort
Type: `Array or String`

A list of fields to sort on. If multiple fields are passed then they are executed in order. Adding a '-' sign t the start of the field name make it sort descending. Default is ascending.

Example:

```js
{
  sort: ['name', '-createdOn'] // created on is sorted descending.
}
```
##### must
Type: `Object`

An object with key/values that the documents MUST match against. Essentially identical to what is passed to Mongooses .find() and the first argument of .find() in this library.
Elasticsearches internal [Tokenizers](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-tokenizers.html) are not used, and fields are not analyzed. This is essentially a 'must' [Bool Filter](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-filter.html).

*Can be combined with notfilters*

Example:

```js
{
  must: {name: 'Jim'} // All documents matching the name Jim.
}
```
##### not
Type: `Object`

An object with key/values that the documents must NOT match against. This is essentially a 'must_not' [Bool Filter](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-filter.html).

*Can be combined with must filters*

Example:

```js
{
  not: {name: 'Jim'} // All documents that aren't named Jim.
}
// OR
{
  not: {name: ['Jim', 'Bob']} // All documents that aren't named Jim or Bob.
}
```

##### random
Type: `Boolean`

A helper function. It will a randomly seeded function score to the query which will force Elasticsearch to randomly score/sort the documents. This can be expensive, so use sparingly.

*Can't be combined with sort.*

#### TODO
- Create schemas. Right now it's schemaless.
- Allow methods to call Elasticsearch facets.
- Integrate Elasticsearch mappings, and allow dynamic mapping updates.
- Performance tweek application, fix garbage collection issues, and do benchmark tests.
- Integrate npm 'friendly' for use with expanding/collapsing parent/child documents.
