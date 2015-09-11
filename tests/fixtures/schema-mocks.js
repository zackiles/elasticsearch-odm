'use-strict';

module.exports = {
  nestedSingleLevel: nestedSingleLevel(),
  types: types(),
  typeAsType: typeAsType()
};

function nestedSingleLevel(){
  var schema = {
    name: String,
    createdOn: Date,
    nestedDocumentOne: {},
    nestedDocumentTwo: {}
  };
  schema.nestedDocumentArray = [types()];
  schema.nestedDocumentObject = types();
  return schema;
}

function typeAsType(){
  return {
    type: {type: String, required: true},
    nestedType: {
      type: {type: String, required: true}
    }
  };
}

function types(){
  return {
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
    numberArray: [Number],
    numberObj: { type: Number },
    numberObjArray: { type: [Number] },

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
