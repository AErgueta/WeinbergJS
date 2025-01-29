// models/cost.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const costSchema = new Schema({
    codigoCT: { type: String, required: true },
    descCT: { type: String, required: true },
    tamanoCT: { type: String },
    montoCT: { type: Number, required: true },
    noArtiCT: { type: String },
    factorCT: { type: Number, default: 0 }
});

const Cost = mongoose.model('Cost', costSchema);

module.exports = Cost;

