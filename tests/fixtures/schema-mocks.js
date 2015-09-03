'use-strict';

module.exports = {
  nestedSingleLevel: nestedSingleLevel(),
  types: types()
};

function nestedSingleLevel(){
  var schema = {
    name: String,
    createdOn: Date,
    nestedDocumentOne: {},
    nestedDocumentTwo: {}
  };
  schema.nestedDocumentOne = types();
  schema.nestedDocumentTwo = types();
  return schema;
}

function types(){
  return {
    object: Object,
    objectString: 'object',
    objectArray: [Object],
    objectArrayString: ['object'],
    objectObj: { type: Object },
    objectObjArray: { type: [Object] },
    objectObjArrayString: { type: ['object'] },
    objectObjString: { type: 'object' },

    string: String,
    stringString: 'string',
    stringArray: [String],
    stringArrayString: ['string'],
    stringObj: { type: String },
    stringObjArray: { type: [String] },
    stringObjArrayString: { type: ['string'] },
    stringObjString: { type: 'string' },

    date: Date,
    dateString: 'date',
    dateArray: [Date],
    dateArrayString: ['date'],
    dateObj: { type: Date },
    dateObjArray: { type: [Date] },
    dateObjArrayString: { type: ['date'] },
    dateObjString: { type: 'date' },

    boolean: Boolean,
    booleanString: 'boolean',
    booleanArray: [Boolean],
    booleanArrayString: ['boolean'],
    booleanObj: { type: Boolean },
    booleanObjArray: { type: [Boolean] },
    booleanObjArrayString: { type: ['boolean'] },
    booleanObjString: { type: 'boolean' },

    number: Number,
    numberString: 'number',
    numberArray: [Number],
    numberArrayString: ['number'],
    numberObj: { type: Number },
    numberObjArray: { type: [Number] },
    numberObjArrayString: { type: ['number'] },
    numberObjString: { type: 'number' },

    floatString: 'float',
    floatArray: ['float'],
    floatObjString: { type: 'float' },
    floatObjArrayString: { type: ['float'] },

    doubleString: 'double',
    doubleArray: ['double'],
    doubleObjString: { type: 'double' },
    doubleObjArrayString: { type: ['double'] },

    longString: 'long',
    longArray: ['long'],
    longObjString: { type: 'long' },
    longObjArrayString: { type: ['long'] },

    shortString: 'short',
    shortArray: ['short'],
    shortObjString: { type: 'short' },
    shortObjArrayString: { type: ['short'] },

    byteString: 'byte',
    byteArray: ['byte'],
    byteObjString: { type: 'byte' },
    byteObjArrayString: { type: ['byte'] },

    binaryString: 'binary',
    binaryArray: ['binary'],
    binaryObjString: { type: 'binary' },
    binaryObjArrayString: { type: ['binary'] },
  };
}
