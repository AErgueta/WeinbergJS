const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
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
            logoDataUrl
        });

    } catch (error) {
        console.error('❌ Error en /ver-hoja:', error);
        res.status(500).send('Error interno.');
    }
});

// 📤 Exportar Hoja Cotización a PDF
router.get('/descargar-pdf/:detalleId/:versionIndex', async (req, res) => {
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

        const html = await renderTemplate(
            path.join(__dirname, '../views/pdf/vista-preliminar.hbs'),
            { customer, version, quotation, detalle, logoDataUrl }
        );

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('screen');

        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="hoja_cotizacion_${version.titulo || 'sin_titulo'}.pdf"`,
            'Content-Length': pdfBuffer.length
        });
        res.end(pdfBuffer);

    } catch (error) {
        console.error('❌ Error al exportar PDF de hoja:', error);
        res.status(500).send('Error interno al generar el PDF.');
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
            formatDateLong: handlebarsHelpers.formatDateLong
        });

    } catch (error) {
        console.error("❌ Error en /ver-orden-trabajo:", error);
        res.status(500).send("Error interno.");
    }
});

// 📤 Exportar Orden de Trabajo a PDF
router.get('/exportar-orden-pdf/:detalleId/:versionIndex', async (req, res) => {
    const { detalleId, versionIndex } = req.params;

    try {
        const detalleObjectId = new ObjectId(detalleId);
        const calculo = await QuotationCostDetail.findOne({ detalleId: detalleObjectId }).lean();
        if (!calculo) return res.status(404).send('❌ Cálculo no encontrado.');

        const version = calculo.calculos[versionIndex];
        if (!version) return res.status(404).send('❌ Versión no encontrada.');

        const customer = await Customer.findById(calculo.customer).lean();
        const quotation = customer.solicitudesCotizacion.find(q => q._id.toString() === calculo.quotationId.toString());
        const detalle = quotation.detalles.find(d => d._id.toString() === detalleId.toString());

        const logoPath = path.join(__dirname, '../public/img/logo_blk2.png');
        const logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;

        const fechaAceptacion = version.fechaAceptacion
            ? version.fechaAceptacion.toISOString().split('T')[0]
            : '';
        const fechaPrevistaEntrega = version.fechaPrevistaEntrega
            ? version.fechaPrevistaEntrega.toISOString().split('T')[0]
            : '';

        const html = await renderTemplate(
            path.join(__dirname, '../views/pdf/orden-trabajo.hbs'),
            {
                customer,
                version,
                quotation,
                detalle,
                logoDataUrl,
                fechaAceptacion,
                fechaPrevistaEntrega,
                formatDateLong: handlebarsHelpers.formatDateLong
            }
        );

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('screen');

        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="orden_trabajo_${version.titulo || 'sin_titulo'}.pdf"`,
            'Content-Length': pdfBuffer.length
        });
        res.end(pdfBuffer);

    } catch (error) {
        console.error('❌ Error al exportar PDF de orden de trabajo:', error);
        res.status(500).send('Error interno al generar el PDF.');
    }
});

module.exports = router;



