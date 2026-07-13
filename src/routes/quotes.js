const express = require('express');
const router = express.Router();

const Customer = require('../models/customer'); // Modelo de cliente
const Cost = require('../models/cost');         // Modelo de costos

const QuotationCostDetail = require('../models/quotationCostDetail'); // ✅ Líneas del cálculo

const handlebarsHelpers = require('../helpers/handlebars-helpers');


// 👉 Ruta para formulario de nuevo cliente
router.get('/quotes/add', (req, res) => {
    res.render('quotes/new-client');
});

// 👉 Ruta para procesar nuevo cliente
router.post('/quotes/new-client', (req, res) => {
    const { alias, nombre, nombreC, eMail, telf } = req.body;
    const errors = [];

    if (!alias) errors.push({ text: 'Por favor inserte el Alias' });
    if (!nombre) errors.push({ text: 'Por favor digite el nombre del cliente' });
    if (!nombreC) errors.push({ text: 'Por favor digite el nombre del contacto' });
    if (!eMail) errors.push({ text: 'Por favor digite el eMail' });
    if (!telf) errors.push({ text: 'Por favor digite el número de teléfono' });

    if (errors.length > 0) {
        res.render('quotes/new-client', {
            errors, alias, nombre, nombreC, eMail, telf
        });
    } else {
        res.send('Ok');
    }
});

// ✅ NUEVA RUTA: Resumen de Cálculo de Costos (pantalla de resultados)
router.get('/calculatorResumen', async (req, res) => {
    const { quotationId, customerId, detailIndex } = req.query;

    try {
        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).send('Cliente no encontrado');

        const quotation = customer.solicitudesCotizacion.id(quotationId);
        if (!quotation) return res.status(404).send('Cotización no encontrada');

        const detalle = quotation.detalles[detailIndex];
        if (!detalle) return res.status(404).send('Detalle no encontrado');

        const detalleId = detalle._id;

        // 🔹 Buscar el documento que contiene todos los cálculos para este detalle
        const costDocument = await QuotationCostDetail.findOne({ detalleId }).lean();
        if (!costDocument) return res.status(404).send('No hay cálculos guardados para este detalle');

        // 🔹 Enviar todos los cálculos al HBS
        res.render('quotes/calculatorResumen', {
            quotation,
            customer,
            detalle,
            calculos: costDocument.calculos
        });

    } catch (error) {
        console.error("Error en /calculatorResumen:", error);
        res.status(500).send("Error interno del servidor.");
    }
});

// Ruta base de quotes
router.get('/quotes', (req, res) => {
    res.send('Clientes de la Base de Datos');
});

router.get('/quotes/calculator-paper', (req, res) => {
    res.render('quotes/calculator-paper');
});

// Ruta: aceptar-trabajo
// Ruta: aceptar-trabajo
router.get('/quotes/aceptar-trabajo/:detalleId/:versionIndex', async (req, res) => {
    const { detalleId, versionIndex } = req.params;

    try {
        const calculo = await QuotationCostDetail.findOne({ detalleId });
        if (!calculo) return res.status(404).send('❌ Cálculo no encontrado.');

        const version = calculo.calculos[versionIndex];
        if (!version) return res.status(404).send('❌ Versión no encontrada.');

        const customer = await Customer.findById(calculo.customer).lean();
        if (!customer) return res.status(404).send('❌ Cliente no encontrado.');

        const quotation = customer.solicitudesCotizacion.find(q => q._id.toString() === calculo.quotationId.toString());
        if (!quotation) return res.status(404).send('❌ Cotización no encontrada.');

        const detalle = quotation.detalles.find(d => d._id.toString() === detalleId.toString());
        if (!detalle) return res.status(404).send('❌ Detalle no encontrado.');

        const detalleIndex = quotation.detalles.findIndex(d => d._id.toString() === detalleId.toString());

        // 🟡 Formatear fechas en formato YYYY-MM-DD para campos input[type="date"]
        const fechaAceptacion = version.fechaAceptacion
            ? version.fechaAceptacion.toISOString().split('T')[0]
            : '';

        const fechaPrevistaEntrega = version.fechaPrevistaEntrega
            ? version.fechaPrevistaEntrega.toISOString().split('T')[0]
            : '';

        const fechaTerminado = version.fechaTerminado
            ? version.fechaTerminado.toISOString().split('T')[0]
            : '';

        const fechaEntregado = version.fechaEntregado
            ? version.fechaEntregado.toISOString().split('T')[0]
            : '';

        // 🧍‍♂️ Usuarios y otros campos
        const usuarioTermina = version.usuarioTermina || '';
        const usuarioEntrega = version.usuarioEntrega || '';
        const recibidoPor = version.recibidoPor || '';

        const usuarioSesion = req.session.usuario || '';

        // Renderizar pantalla
        res.render("quotes/aceptar-trabajo", {
            customer,
            quotation,
            detalle,
            version,
            customerId: customer._id,
            quotationId: quotation._id,
            detalleIndex,
            versionIndex,
            fechaAceptacion,
            fechaPrevistaEntrega,
            fechaTerminado,
            fechaEntregado,
            usuarioTermina,
            usuarioEntrega,
            recibidoPor,
            user: { name: usuarioSesion }
        });

    } catch (error) {
        console.error("❌ Error en aceptar-trabajo:", error);
        res.status(500).send("Error interno al cargar la aceptación.");
    }
});

router.post('/guardar-orden-trabajo/:customerId/:quotationId/:detalleIndex', async (req, res) => {
  const { customerId, quotationId, detalleIndex } = req.params;
  const {
    aceptada,
    fechaAceptacion,
    fechaPrevistaEntrega,
    detalleId,
    versionIndex
  } = req.body;

  try {
    // --------------------------
    // 🟩 Paso 1: Actualizar en la colección Customer
    // --------------------------
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).send("Cliente no encontrado.");

    // 1. Encontramos el índice numérico exacto de la cotización
    const cotizacionIndex = customer.solicitudesCotizacion.findIndex(q => q._id.toString() === quotationId);
    if (cotizacionIndex === -1) return res.status(404).send("Cotización no encontrada.");
    
    const cotizacion = customer.solicitudesCotizacion[cotizacionIndex];

    // 2. Aseguramos que el índice del detalle sea un número
    const dIndex = parseInt(detalleIndex, 10);
    const detalle = cotizacion.detalles[dIndex];
    if (!detalle) return res.status(404).send("Detalle no encontrado.");

    // Guardamos los valores
    detalle.aceptada = (aceptada === true || aceptada === 'true');
    detalle.fechaAceptacion = fechaAceptacion || null;
    detalle.fechaPrevistaEntrega = fechaPrevistaEntrega || null;

    // 3. Forzamos el guardado de la ruta anidada exacta en Mongoose
    customer.markModified(`solicitudesCotizacion.${cotizacionIndex}.detalles.${dIndex}.aceptada`);
    
    await customer.save();
    console.log("✅ Datos guardados en Customer con el booleano forzado.");

    // --------------------------
    // 🟦 Paso 2: Actualizar en QuotationCostDetail → dentro de calculoSchema
    // --------------------------
    const quotationCost = await QuotationCostDetail.findOne({ detalleId });
    if (!quotationCost) return res.status(404).send("Cálculo de costos no encontrado.");

    const versionNum = parseInt(versionIndex, 10);
    if (isNaN(versionNum) || versionNum < 0 || versionNum >= quotationCost.calculos.length) {
        return res.status(404).send("Versión de cálculo inválida.");
    }

    // Actualizar los campos directamente dentro de la versión
    quotationCost.calculos[versionNum].aceptada = (aceptada === true || aceptada === 'true');
    quotationCost.calculos[versionNum].fechaAceptacion = fechaAceptacion || null;
    quotationCost.calculos[versionNum].fechaPrevistaEntrega = fechaPrevistaEntrega || null;

    // Forzar a Mongoose a detectar el cambio en este array específico
    quotationCost.markModified(`calculos.${versionNum}`);

    await quotationCost.save();
    console.log("✅ Datos guardados correctamente en calculoSchema.");
    
    res.status(200).send("Orden de trabajo guardada en ambos modelos.");
  } catch (err) {
    console.error("❌ Error al guardar orden:", err);
    res.status(500).send("Error interno al guardar.");
  }
});

router.post('/marcar-trabajo-terminado/:detalleId/:versionIndex', async (req, res) => {
  const { detalleId, versionIndex } = req.params;
  const { terminado, fechaTerminado, usuarioTermina } = req.body;

  try {
    const quotationCost = await QuotationCostDetail.findOne({ detalleId });
    if (!quotationCost) return res.status(404).send("❌ Cálculo de costos no encontrado.");

    const versionIndexNum = parseInt(versionIndex, 10);
    const version = quotationCost.calculos[versionIndexNum];
    if (!version) return res.status(404).send("❌ Versión no encontrada.");

    // ✅ Actualizar campos recibidos
    version.terminado = terminado === true || terminado === 'true';
    version.fechaTerminado = fechaTerminado || null;
    version.usuarioTermina = usuarioTermina || 'Sistema';

    // 🔧 Forzar a Mongoose a marcar como modificado
    quotationCost.markModified(`calculos.${versionIndexNum}`);

    console.log("🧾 Usuario recibido:", usuarioTermina);

    await quotationCost.save();
    console.log("✅ Trabajo marcado como terminado.");
    res.status(200).send("Trabajo terminado actualizado.");
  } catch (error) {
    console.error("❌ Error al marcar trabajo como terminado:", error);
    res.status(500).send("Error interno al guardar trabajo terminado.");
  }
});

router.post('/marcar-trabajo-entregado/:detalleId/:versionIndex', async (req, res) => {
    const { detalleId, versionIndex } = req.params;
    const { entregado, fechaEntregado, recibidoPor, usuarioEntrega } = req.body;

    try {
        const quotationCost = await QuotationCostDetail.findOne({ detalleId });
        if (!quotationCost) return res.status(404).send("❌ Cálculo de costos no encontrado.");

        const versionIndexNum = parseInt(versionIndex, 10);
        const version = quotationCost.calculos[versionIndexNum];
        if (!version) return res.status(404).send("❌ Versión no encontrada.");

        // Guardar los datos
        version.entregado = entregado === true || entregado === 'true';
        version.fechaEntregado = fechaEntregado || null;
        version.recibidoPor = recibidoPor || '';
        version.usuarioEntrega = usuarioEntrega || 'Sistema';

        await quotationCost.save();
        console.log("✅ Trabajo marcado como entregado.");
        res.status(200).send("Trabajo entregado actualizado.");

    } catch (error) {
        console.error("❌ Error al marcar trabajo como entregado:", error);
        res.status(500).send("Error interno al guardar entrega.");
    }
});

module.exports = router;
