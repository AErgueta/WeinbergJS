// models/customer.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const quotationSchema = new Schema({
    lineaQuo: { type: Number, required: true },
    tipoQuo: { type: String, enum: ['P', 'R'], required: true },
    cantidadQuo: { type: Number },
    descripcionQuo: { type: String, required: true }
});

const quotationHeaderSchema = new Schema({
    fecha: { type: Date, required: true },
    fechaVence: { type: Date },
    descripcionCorta: { type: String, required: true },
    detalles: [quotationSchema]
});

const customerSchema = new Schema({
    aliasCus: { type: String, required: true },
    nombreCus: { type: String, required: true },
    contactoCus: { type: String },
    eMailCus: { type: String },
    telefonoCus: { type: String },
    solicitudesCotizacion: [quotationHeaderSchema] // Array de solicitudes de cotización
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;