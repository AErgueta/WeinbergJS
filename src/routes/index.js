// routes/index.js
const express = require('express');
const router = express.Router();
const QuotationCostDetail = require('../models/quotationCostDetail');
const Customer = require('../models/customer');

router.get('/', async (req, res) => {
    // Variables iniciales por si el usuario no está logueado
    let dashboardData = {
        countSinCotizar: 0, // 🟢 Agregamos la nueva variable aquí
        countProduccion: 0,
        countPorEntregar: 0,
        countCotizacionesMes: 0
    };

    // Si el usuario está logueado, calculamos los indicadores
    if (req.user) {
        try {
            // 1. Trabajos en Producción: Aceptados (true) y NO Terminados (false)
            const countProduccion = await QuotationCostDetail.countDocuments({
                'calculos': { $elemMatch: { aceptada: true, terminado: false } }
            });

            // 2. Trabajos Por Entregar: Terminados (true) y NO Entregados (false)
            const countPorEntregar = await QuotationCostDetail.countDocuments({
                'calculos': { $elemMatch: { terminado: true, entregado: false } }
            });

            // 3. Cotizaciones del Mes Actual
            const startOfMonth = new Date();
            startOfMonth.setDate(1); // Día 1 del mes actual
            startOfMonth.setHours(0, 0, 0, 0);

            // Usamos aggregate para contar cotizaciones dentro del array del cliente
            const resultCotizaciones = await Customer.aggregate([
                { $unwind: '$solicitudesCotizacion' },
                { $match: { 'solicitudesCotizacion.fecha': { $gte: startOfMonth } } },
                { $count: 'total' }
            ]);
            const countCotizacionesMes = resultCotizaciones.length > 0 ? resultCotizaciones[0].total : 0;

            // ==========================================
            // 🟢 4. SOLICITUDES SIN COTIZAR (Últimos 30 días)
            // ==========================================
            const treintaDiasAtras = new Date();
            treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

            // A) Obtenemos los IDs de todos los detalles solicitados en los últimos 30 días
            const solicitudesRecientes = await Customer.aggregate([
                { $unwind: '$solicitudesCotizacion' },
                { $match: { 'solicitudesCotizacion.fecha': { $gte: treintaDiasAtras } } },
                { $unwind: '$solicitudesCotizacion.detalles' },
                { $project: { _id: 0, detalleId: '$solicitudesCotizacion.detalles._id' } }
            ]);

            const detallesIds = solicitudesRecientes.map(s => s.detalleId);

            // B) Contamos cuántos de esos detalles YA TIENEN un documento de costo guardado
            const cotizadosCount = await QuotationCostDetail.countDocuments({
                detalleId: { $in: detallesIds }
            });

            // C) La diferencia matemática nos da los trabajos pendientes de cotizar
            const countSinCotizar = detallesIds.length - cotizadosCount;

            // Actualizamos el objeto que va hacia el frontend
            dashboardData = {
                countSinCotizar,
                countProduccion,
                countPorEntregar,
                countCotizacionesMes
            };

        } catch (error) {
            console.error('Error calculando datos del dashboard:', error);
            // Si hay error, no detenemos la carga, solo mostramos ceros
        }
    }

    // Renderizamos pasando los datos
    res.render('index', dashboardData);
});

router.get('/about', (req, res) => {
    res.render('about');
});

module.exports = router;