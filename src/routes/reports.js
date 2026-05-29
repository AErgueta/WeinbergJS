// routes/reports.js
// Archivo de rutas para la generación de reportes

const express = require('express');
const router = express.Router();
const path = require('path');     // Necesario para la ruta del logo
const fs = require('fs');         // Necesario para leer el archivo del logo
const Customer = require('../models/customer');
const { isAuthenticated } = require('../helpers/auth'); // Middleware de autenticación

// -----------------------------------------------------------
// 1. RUTA GET: Muestra el formulario de filtro de fechas
// -----------------------------------------------------------
router.get('/reports/seguimiento', isAuthenticated, (req, res) => {
    // Renderiza la vista del formulario de fechas
    res.render('reports/form-seguimiento'); 
});


// -----------------------------------------------------------
// 2. RUTA POST: Procesa el formulario y genera el reporte
// -----------------------------------------------------------
router.post('/reports/seguimiento-data', isAuthenticated, async (req, res) => {
    const { fechaInicio, fechaFin } = req.body;
    
    // Configurar fechas para la consulta de rango (MongoDB usa UTC)
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
    // Ajuste para incluir todo el día de la fecha de fin (hasta el final del día)
    end.setDate(end.getDate() + 1); 

    try {
        // --- Lógica de Agregación de MongoDB ---
        const reportData = await Customer.aggregate([
            // 1. Descomponer el array de cotizaciones (una línea por cada cotización)
            { $unwind: '$solicitudesCotizacion' },
            
            // 2. Filtrar por el rango de fechas de la cotización
            { $match: {
                'solicitudesCotizacion.fecha': { $gte: start, $lt: end }
            }},

            // 3. Unir con los detalles de costo (donde están los estados de aceptado/terminado/entregado)
            { $lookup: {
                from: 'quotationcostdetails', // Nombre de la colección en DB (minúsculas y plural)
                localField: 'solicitudesCotizacion._id',
                foreignField: 'quotationId',
                as: 'detallesCosto'
            }},

            // 4. Proyección intermedia (Datos del cliente + el primer cálculo de costo)
            { $project: {
                _id: 0,
                clienteAlias: '$aliasCus',
                clienteNombre: '$nombreCus',
                codigoCotizacion: '$solicitudesCotizacion.codigoCotizacion',
                fechaCotizacion: '$solicitudesCotizacion.fecha',
                descripcionCorta: '$solicitudesCotizacion.descripcionCorta',
                // Tomamos el primer set de cálculos si existe.
                detalleCosto: { $arrayElemAt: ['$detallesCosto.calculos', 0] }
            }},
            
            // 5. Descomponer el array de cálculos (si existe)
            { $unwind: {
                path: '$detalleCosto',
                preserveNullAndEmptyArrays: true // Mantiene cotizaciones que no tienen detalles de costo aún
            }},

            // 6. Proyección final (Selección y renombramiento de campos)
            { $project: {
                clienteAlias: 1,
                clienteNombre: 1,
                codigoCotizacion: 1,
                descripcionCorta: 1,
                fechaCotizacion: 1,
                
                // 👇 NUEVO CAMPO: Fecha en que se hizo el cálculo (Cotizado)
                fechaCalculo: '$detalleCosto.fecha', 

                // Estados (extraídos del detalle de costo o null si no existe)
                aceptada: '$detalleCosto.aceptada',
                fechaAceptacion: '$detalleCosto.fechaAceptacion',
                terminado: '$detalleCosto.terminado',
                fechaTerminado: '$detalleCosto.fechaTerminado',
                entregado: '$detalleCosto.entregado',
                fechaEntregado: '$detalleCosto.fechaEntregado',
            }},

            // 7. Ordenar el reporte por fecha de cotización
            { $sort: { fechaCotizacion: 1 } }
        ]);
        // --- Fin Lógica de Agregación ---


        // --- Lógica para el formato PDF/Impresión (Logo Base64) ---
        // Construye la ruta al archivo del logo (asumiendo que está en /public/img/)
        const logoPath = path.join(__dirname, '../public/img/logo_blk2.png');
        let logoDataUrl = '';
        
        // Verifica si el archivo existe antes de leerlo
        if (fs.existsSync(logoPath)) {
            logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
        }

        // 4. Renderizar la vista
        res.render('reports/reporte-seguimiento', {
            reportData,
            fechaInicio,
            fechaFin,
            logoDataUrl,   // Logo codificado
            layout: false, // Desactivar layout principal para el formato A4/Impresión
        });

    } catch (error) {
        console.error('Error generando el reporte de seguimiento:', error);
        res.status(500).send('Error al generar el reporte.');
    }
});

module.exports = router;