const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subdocumento: una línea individual de cálculo
const costLineSchema = new Schema({
  lineaQuo:       { type: Number, required: true },
  tipoMaterial:   { type: String, enum: ['P','T','L','C','A','R','M','I','O','S','U'], required: true },
  noArticulo:     { type: String, required: true },
  descripcion:    { type: String },    // aquí se almacena el nombre/descripción del material
  cantidad:       { type: Number, required: true },
  precio:         { type: Number, required: true },
  monto:          { type: Number, required: true },
  detalle:        { type: String },    // campo opcional adicional
  factor:         { type: Number, default: 0 },
  cantidadM:      { type: Number, default: 0 }
});

// Subdocumento: un cálculo completo
const calculoSchema = new Schema({
  titulo:               { type: String, required: true },
  fecha:                { type: Date,   default: Date.now },
  usuario:              { type: String },

  lineas:               [ costLineSchema ],

  // ← Movemos aquí los tres campos de aceptación
  aceptada:             { type: Boolean, default: false },
  fechaAceptacion:      { type: Date },
  fechaPrevistaEntrega: { type: Date },
  terminado: { type: Boolean, default: false },
  fechaTerminado: { type: Date },
  usuarioTermina: { type: String }
}, {
  timestamps: true
});

// Documento principal: relación con cliente, cotización y detalle
const quotationCostDetailSchema = new Schema({
  customer:      { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  quotationId:   { type: Schema.Types.ObjectId, required: true },
  detalleId:     { type: Schema.Types.ObjectId, required: true },

  // ← Eliminamos estos tres campos de aquí, porque ahora van en cada "version" (calculoSchema)
  // aceptada:           { type: Boolean, default: false },
  // fechaAceptacion:    { type: Date },
  // fechaPrevistaEntrega:{ type: Date },

  calculos:      [ calculoSchema ]

}, {
  timestamps: true
});

const QuotationCostDetail = mongoose.model('QuotationCostDetail', quotationCostDetailSchema);
module.exports = QuotationCostDetail;
