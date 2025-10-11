// models/counter.js
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // identificador del contador
  seq: { type: Number, default: 0 }                     // último número usado
});

const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;
