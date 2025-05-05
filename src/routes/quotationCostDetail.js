// routes/quotationCostDetail.js
const express = require('express');
const router = express.Router();
const QuotationCostDetail = require('../models/quotationCostDetail');

router.post('/guardar-costos', async (req, res) => {
    try {
        const { customerId, quotationId, detalleId, titulo, usuario, detalles } = req.body;

        if (!customerId || !quotationId || !detalleId || !titulo || !Array.isArray(detalles)) {
            return res.status(400).json({ message: 'Datos incompletos o malformados.' });
        }

        const lineasFormateadas = detalles.map(linea => ({
            lineaQuo: linea.lineaQuo,
            tipoMaterial: linea.tipoMaterial,
            noArticulo: linea.noArticulo,
            descripcion: linea.descripcion,
            cantidad: linea.cantidad,
            precio: linea.precio,
            monto: linea.monto,
            detalle: linea.detalle,
            factor: linea.factor || 0,
            cantidadM: linea.cantidadM || 0
        }));

        // Construimos la cabecera de cálculo con las líneas
        const nuevoCalculo = {
            titulo,
            usuario,
            lineas: lineasFormateadas
        };

        // Buscamos si ya existe un documento principal para ese customer/quotation/detalle
        let registro = await QuotationCostDetail.findOne({
            customer: customerId,
            quotationId: quotationId,
            detalleId: detalleId
        });

        if (registro) {
            // Si existe, agregamos un nuevo cálculo
            registro.calculos.push(nuevoCalculo);
        } else {
            // Si no existe, lo creamos
            registro = new QuotationCostDetail({
                customer: customerId,
                quotationId,
                detalleId,
                calculos: [nuevoCalculo]
            });
        }

        await registro.save();

        res.status(200).json({ message: 'Cálculo guardado correctamente.' });

    } catch (error) {
        console.error('Error al guardar los costos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;
