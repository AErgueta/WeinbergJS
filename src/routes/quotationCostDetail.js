// routes/quotationCostDetail.js
const express = require('express');
const router = express.Router();
const QuotationCostDetail = require('../models/quotationCostDetail');

// Ruta para guardar múltiples líneas de costo
router.post('/guardar-costos', async (req, res) => {
    try {
        const { customerId, quotationId, detalles } = req.body;

        if (!customerId || !quotationId || !Array.isArray(detalles)) {
            return res.status(400).json({ message: 'Datos incompletos o malformados.' });
        }

        const detallesFormateados = detalles.map(linea => ({
            customer: customerId,
            quotationId: quotationId,
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

        // Guardar múltiples documentos de una vez
        await QuotationCostDetail.insertMany(detallesFormateados);

        res.status(200).json({ message: 'Costos guardados correctamente.' });
    } catch (error) {
        console.error('Error al guardar los costos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;