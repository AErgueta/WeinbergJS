const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const path = require('path');
const hbs = require('express-handlebars');
const fs = require('fs');
const QuotationCostDetail = require('../models/quotationCostDetail');
const Customer = require('../models/customer');
const handlebarsHelpers = require('../helpers/handlebars-helpers');

// Ruta: Mostrar hoja de cotización en formato HTML
router.get('/ver-hoja/:detalleId/:versionIndex', async (req, res) => {
    const { detalleId, versionIndex } = req.params;

    try {
        const calculo = await QuotationCostDetail.findOne({ detalleId }).lean();
        if (!calculo) return res.status(404).send('No se encontró el cálculo.');

        const version = calculo.calculos[versionIndex];
        if (!version) return res.status(404).send('Versión de cálculo no encontrada.');

        const customer = await Customer.findById(calculo.customer).lean();
        if (!customer) return res.status(404).send('Cliente no encontrado');

        const quotation = customer.solicitudesCotizacion.find(q => q._id.toString() === calculo.quotationId.toString());
        if (!quotation) return res.status(404).send('Cotización no encontrada.');

        const detalle = quotation.detalles.find(d => d._id.toString() === calculo.detalleId.toString());
        if (!detalle) return res.status(404).send('Detalle no encontrado');

        res.render('pdf/vista-preliminar', {
            version,
            customer,
            quotation,
            detalle
        });

    } catch (error) {
        console.error('Error al cargar la vista:', error);
        res.status(500).send('Error interno.');
    }
});

// Ruta: Descargar hoja de cotización como PDF
router.get('/descargar-pdf/:detalleId/:versionIndex', async (req, res) => {
    const { detalleId, versionIndex } = req.params;

    try {
        const calculo = await QuotationCostDetail.findOne({ detalleId }).lean();
        if (!calculo) return res.status(404).send('Cálculo no encontrado.');

        const version = calculo.calculos[versionIndex];
        if (!version) return res.status(404).send('Versión no encontrada.');

        const customer = await Customer.findById(calculo.customer).lean();
        if (!customer) return res.status(404).send('Cliente no encontrado.');

        const quotation = customer.solicitudesCotizacion.find(q => q._id.toString() === calculo.quotationId.toString());
        if (!quotation) return res.status(404).send('Cotización no encontrada.');

        const detalle = quotation.detalles.find(d => d._id.toString() === calculo.detalleId.toString());
        if (!detalle) return res.status(404).send('Detalle no encontrado');

        const html = await renderTemplate(
            path.join(__dirname, '../views/pdf/vista-preliminar.hbs'),
            { customer, version, quotation, detalle }
        );

        // 💾 Guarda el HTML para depuración
        fs.writeFileSync('temp-vista.html', html);

        // 🖨️ Genera el PDF
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('screen');
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        // 📤 Enviar el PDF correctamente
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=hoja_cotizacion_${version.titulo}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.end(pdfBuffer); // ✅ Usamos .end en lugar de .send

    } catch (error) {
        console.error('❌ Error al generar PDF desde hoja:', error);
        res.status(500).send('Error interno al generar el PDF.');
    }
});


// Función auxiliar para compilar plantilla Handlebars con helpers
async function renderTemplate(filePath, data) {
    const templateContent = fs.readFileSync(filePath, 'utf8');
    const handlebars = hbs.create();

    handlebars.handlebars.registerHelper('sum', handlebarsHelpers.sum);
    handlebars.handlebars.registerHelper('formatCurrency', handlebarsHelpers.formatCurrency);
    handlebars.handlebars.registerHelper('formatDateLong', handlebarsHelpers.formatDateLong);

    const compiled = handlebars.handlebars.compile(templateContent);
    return compiled(data);
}

module.exports = router;
