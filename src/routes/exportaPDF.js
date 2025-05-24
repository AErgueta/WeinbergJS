const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const path = require('path');
const hbs = require('express-handlebars');
const fs = require('fs');
const QuotationCostDetail = require('../models/quotationCostDetail');
const Customer = require('../models/customer');
const handlebarsHelpers = require('../helpers/handlebars-helpers');

// Vista previa HTML
router.get('/ver-hoja/:detalleId/:versionIndex', async (req, res) => {
    const { detalleId, versionIndex } = req.params;

    try {
        const calculo = await QuotationCostDetail.findOne({ detalleId }).lean();
        if (!calculo) return res.status(404).send('No se encontró el cálculo.');

        const version = calculo.calculos[versionIndex];
        if (!version) return res.status(404).send('Versión no encontrada.');

        const customer = await Customer.findById(calculo.customer).lean();
        const quotation = customer.solicitudesCotizacion.find(q => q._id.toString() === calculo.quotationId.toString());
        const detalle = quotation.detalles.find(d => d._id.toString() === calculo.detalleId.toString());

        const logoAbsolutePath = path.join(__dirname, '../public/img/logo_blk2.png');
        const logoBuffer = fs.readFileSync(logoAbsolutePath);
        const logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;

        res.render('pdf/vista-preliminar', {
            customer,
            version,
            quotation,
            detalle,
            logoDataUrl
        });


    } catch (error) {
        console.error('Error al cargar la vista:', error);
        res.status(500).send('Error interno.');
    }
});

// Exportar PDF
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
        if (!detalle) return res.status(404).send('Detalle no encontrado.');

        // ✅ Leer logo en base64
        
        const logoAbsolutePath = path.join(__dirname, '../public/img/logo_blk2.png');
        const logoBuffer = fs.readFileSync(logoAbsolutePath);
        const logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    

        // ✅ Renderizar la plantilla con logo base64
        const html = await renderTemplate(
            path.join(__dirname, '../views/pdf/vista-preliminar.hbs'),
            { customer, version, quotation, detalle, logoDataUrl }
        );


        // (opcional) Guardar HTML temporal para depurar
        fs.writeFileSync('temp-vista.html', html);

        // 🖨️ Generar el PDF
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('screen');

        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        // Enviar PDF
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=hoja_cotizacion_${version.titulo}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.end(pdfBuffer);

    } catch (error) {
        console.error('❌ Error al generar PDF desde hoja:', error);
        res.status(500).send('Error interno al generar el PDF.');
    }
});


// Handlebars rendering
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
