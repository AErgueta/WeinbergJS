const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const path = require('path');
const hbs = require('express-handlebars');
const fs = require('fs');
const QuotationCostDetail = require('../models/quotationCostDetail');
const Customer = require('../models/customer');
const handlebarsHelpers = require('../helpers/handlebars-helpers');

// Ruta: Generar PDF de una versión específica
router.get('/exportar-pdf/:detalleId/:versionIndex', async (req, res) => {
    const { detalleId, versionIndex } = req.params;

    try {
        // Buscar por ID exacto (ObjectId), no por campo 'detalleId'
        const calculo = await QuotationCostDetail.findOne({ detalleId }).lean();
        if (!calculo) return res.status(404).send('Cálculo no encontrado.');

        const version = calculo.calculos[versionIndex];
        if (!version) return res.status(404).send('Versión de cálculo no encontrada.');

        // Renderizar HTML desde Handlebars
        const html = await renderTemplate(
            path.join(__dirname, '../views/pdf/pdf-calculo.hbs'),
            { version, detalleId }
        );

        // (Opcional) Guardar HTML generado para depurar
        fs.writeFileSync('temp.html', html);
        console.log('✅ HTML generado y guardado como temp.html');

        // Generar PDF con Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' }); // 👈 importante
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        // Enviar PDF al navegador como descarga
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=calculo_${version.titulo}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('🛑 Error al generar PDF:', error);
        res.status(500).send('Error interno al generar el PDF.');
    }
});

router.get('/ver-hoja/:detalleId/:versionIndex', async (req, res) => {
    const { detalleId, versionIndex } = req.params;

    try {
        const calculo = await QuotationCostDetail.findOne({ detalleId }).lean();
        if (!calculo) return res.status(404).send('No se encontró el cálculo.');

        const version = calculo.calculos[versionIndex];
        if (!version) return res.status(404).send('Versión de cálculo no encontrada.');

        // Obtener el customer completo
        const customer = await Customer.findById(calculo.customer).lean();
        if (!customer) return res.status(404).send('Cliente no encontrado');

        // Obtener la cotización a partir del quotationId que viene del cálculo
        const quotation = customer.solicitudesCotizacion.find(q => q._id.toString() === calculo.quotationId.toString());
        if (!quotation) return res.status(404).send('Cotización no encontrada.');

        // Obtener el detalle correspondiente
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



 
// Función auxiliar para compilar plantilla Handlebars con helpers
async function renderTemplate(filePath, data) {
    const templateContent = fs.readFileSync(filePath, 'utf8');
    const handlebars = hbs.create();

    // Registrar helper sum
    handlebars.handlebars.registerHelper('sum', handlebarsHelpers.sum);

    const compiled = handlebars.handlebars.compile(templateContent);
    return compiled(data);
}

module.exports = router;
