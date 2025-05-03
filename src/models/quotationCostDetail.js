// models/quotationCostDetail.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const quotationCostDetailSchema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true }, // referencia directa al cliente
    quotationId: { type: Schema.Types.ObjectId, required: true }, // id de la solicitud dentro de solicitudesCotizacion[]
    lineaQuo: { type: Number, required: true }, // número de línea (por si se requiere)
    tipoMaterial: { type: String, enum: ['P', 'T', 'L', 'C', 'A', 'R', 'M', 'I', 'O', 'S', 'U'], required: true },
    noArticulo: { type: String, required: true }, // código del artículo
    descripcion: { type: String }, // descripción del artículo (se guarda en texto por si cambia luego)
    cantidad: { type: Number, required: true },
    precio: { type: Number, required: true },
    monto: { type: Number, required: true },
    detalle: { type: String }, // texto libre
    factor: { type: Number, default: 0 }, // en caso de papel
    cantidadM: { type: Number, default: 0 } // en caso de papel
}, {
    timestamps: true
});

const QuotationCostDetail = mongoose.model('QuotationCostDetail', quotationCostDetailSchema);
module.exports = QuotationCostDetail;
