// models/quotationCostDetail.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const quotationCostDetailSchema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    quotationId: { type: Schema.Types.ObjectId, required: true },
    detalleId: { type: Schema.Types.ObjectId, required: true }, // Nuevo campo
    lineaQuo: { type: Number, required: true },
    tipoMaterial: { type: String, enum: ['P', 'T', 'L', 'C', 'A', 'R', 'M', 'I', 'O', 'S', 'U'], required: true },
    noArticulo: { type: String, required: true },
    descripcion: { type: String },
    cantidad: { type: Number, required: true },
    precio: { type: Number, required: true },
    monto: { type: Number, required: true },
    detalle: { type: String },
    factor: { type: Number, default: 0 },
    cantidadM: { type: Number, default: 0 }
}, {
    timestamps: true
});

const QuotationCostDetail = mongoose.model('QuotationCostDetail', quotationCostDetailSchema);
module.exports = QuotationCostDetail;
