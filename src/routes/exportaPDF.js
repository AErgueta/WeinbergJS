const express = require('express');
const router = express.Router();
const path = require('path');
const hbs = require('express-handlebars');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const QuotationCostDetail = require('../models/quotationCostDetail');
const Customer = require('../models/customer');
const handlebarsHelpers = require('../helpers/handlebars-helpers');


// 🔧 Render de plantilla handlebars
async function renderTemplate(filePath, data) {
    const templateContent = fs.readFileSync(filePath, 'utf8');
    const handlebars = hbs.create();

    handlebars.handlebars.registerHelper('sum', handlebarsHelpers.sum);
    handlebars.handlebars.registerHelper('formatCurrency', handlebarsHelpers.formatCurrency);
    handlebars.handlebars.registerHelper('formatDateLong', handlebarsHelpers.formatDateLong);
    handlebars.handlebars.registerHelper('groupByTipo', handlebarsHelpers.groupByTipo);
    handlebars.handlebars.registerHelper('formatDateLocal', handlebarsHelpers.formatDateLocal);
    handlebars.handlebars.registerHelper('getPapelDescripciones', handlebarsHelpers.getPapelDescripciones);
    handlebars.handlebars.registerHelper('isModulo', handlebarsHelpers.isModulo);

    const compiled = handlebars.handlebars.compile(templateContent);
    return compiled(data);
}

// 🧾 Vista previa Hoja Cotización
router.get('/ver-hoja/:detalleId/:versionIndex', async (req, res) => {
    const { detalleId, versionIndex } = req.params;

    try {
        const detalleObjectId = new ObjectId(detalleId);
        const calculo = await QuotationCostDetail.findOne({ detalleId: detalleObjectId }).lean();
        if (!calculo) return res.status(404).send('❌ Cálculo no encontrado.');

        const version = calculo.calculos[versionIndex];
        if (!version) return res.status(404).send('❌ Versión no encontrada.');

        const customer = await Customer.findById(calculo.customer).lean();
        const quotation = customer.solicitudesCotizacion.find(q => q._id.toString() === calculo.quotationId.toString());
        const detalle = quotation.detalles.find(d => d._id.toString() === calculo.detalleId.toString());

        const logoPath = path.join(__dirname, '../public/img/logo_blk2.png');
        const logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;

        res.render('pdf/vista-preliminar', {
          customer,
          version,
          quotation,
          detalle,
          logoDataUrl,
          codigoCotizacion: quotation.codigoCotizacion   // 👈 agregado
      });

    } catch (error) {
        console.error('❌ Error en /ver-hoja:', error);
        res.status(500).send('Error interno.');
    }
});

// 🧾 Vista previa de la orden de trabajo
router.get('/ver-orden-trabajo/:detalleId/:versionIndex', async (req, res) => {
    const { detalleId, versionIndex } = req.params;

    try {
        const detalleObjectId = new ObjectId(detalleId);
        const calculo = await QuotationCostDetail.findOne({ detalleId: detalleObjectId }).lean();
        if (!calculo) return res.status(404).send("❌ Cálculo no encontrado.");

        const version = calculo.calculos[versionIndex];
        if (!version) return res.status(404).send("❌ Versión no encontrada.");

        const customer = await Customer.findById(calculo.customer).lean();
        const quotation = customer.solicitudesCotizacion.find(q => q._id.toString() === calculo.quotationId.toString());
        const detalle = quotation.detalles.find(d => d._id.toString() === detalleId);

        const logoPath = path.join(__dirname, '../public/img/logo_blk2.png');
        const logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;

        const fechaAceptacion = version.fechaAceptacion
            ? new Date(version.fechaAceptacion).toISOString().split('T')[0]
            : '';
        const fechaPrevistaEntrega = version.fechaPrevistaEntrega
            ? new Date(version.fechaPrevistaEntrega).toISOString().split('T')[0]
            : '';

        res.render("pdf/orden-trabajo", {
          customer,
          version,
          quotation,
          detalle,
          logoDataUrl,
          fechaAceptacion,
          fechaPrevistaEntrega,
          formatDateLong: handlebarsHelpers.formatDateLong,
          codigoCotizacion: quotation.codigoCotizacion   // 👈 agregado
      });

    } catch (error) {
        console.error("❌ Error en /ver-orden-trabajo:", error);
        res.status(500).send("Error interno.");
    }
});

// 🧾 Vista previa de Cotización General (todos los detalles con cálculos)
router.get('/ver-cotizacion-general/:customerId/:quotationId', async (req, res) => {
  const { customerId, quotationId } = req.params;

  try {
    // 🟢 Cargar cliente y cotización
    const customer = await Customer.findById(customerId).lean();
    if (!customer) return res.status(404).send('❌ Cliente no encontrado.');

    const quotation = customer.solicitudesCotizacion.find(q => q._id.toString() === quotationId);
    if (!quotation) return res.status(404).send('❌ Cotización no encontrada.');

    // 🟠 Buscar detalles con cálculo en QuotationCostDetail
    const calculos = await QuotationCostDetail.find({
      customer: customerId,
      quotationId: quotationId
    }).lean();

    const detallesCalculados = [];

    // 🔁 Recorrer todos los detalles de la cotización
    for (const detalle of quotation.detalles) {
      const calculoRelacionado = calculos.find(c => c.detalleId.toString() === detalle._id.toString());

      if (calculoRelacionado && calculoRelacionado.calculos.length > 0) {
        detallesCalculados.push({
          cantidadQuo: detalle.cantidadQuo,
          descripcionQuo: detalle.descripcionQuo,
          calculos: calculoRelacionado.calculos
        });
      }
    }

    // 🖼️ Logo base64
    const logoPath = path.join(__dirname, '../public/img/logo_blk2.png');
    const logoBuffer = fs.readFileSync(logoPath);
    const logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;

    // 👤 Usuario (si estás usando login)
    const userName = req.user?.name || 'Usuario';

    // ✅ Renderizar vista
    res.render('pdf/cotizacion-general', {
        customer,
        quotation,
        detallesCalculados,
        logoDataUrl,
        user: { name: userName },
        formatDateLong: handlebarsHelpers.formatDateLong,
        formatCurrency: handlebarsHelpers.formatCurrency,
        sum: handlebarsHelpers.sum,
        codigoCotizacion: quotation.codigoCotizacion   // 👈 agregado
    });

  } catch (error) {
    console.error('❌ Error en vista de cotización general:', error);
    res.status(500).send('Error interno al generar vista.');
  }
});

module.exports = router;



