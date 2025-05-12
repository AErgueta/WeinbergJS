const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const path = require('path');
const hbs = require('express-handlebars');
const fs = require('fs');
const Customer = require('../models/customer');
const QuotationCostDetail = require('../models/quotationCostDetail');

// Ruta: Generar PDF de una versión específica
router.get('/exportar-pdf/:detalleId/:versionIndex', async (req, res) => {
    const { detalleId, versionIndex } = req.params;

    try {
        const calculo = await QuotationCostDetail.findOne({ "calculos._id": detalleId }).lean();
        if (!calculo) return res.status(404).send('Cálculo no encontrado.');

        const version = calculo.calculos[versionIndex];
        if (!version) return res.status(404).send('Versión de cálculo no encontrada.');

        // Renderizar la vista con Handlebars a HTML
        const html = await renderTemplate(path.join(__dirname, '../views/pdf/pdf-calculo.hbs'), {
            version,
            detalleId,
        });

        // Generar PDF con Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        // Descargar el PDF
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=calculo_${version.titulo}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).send('Error interno al generar el PDF.');
    }
});

// Función auxiliar para renderizar un archivo .hbs con datos
async function renderTemplate(filePath, data) {
    const templateContent = fs.readFileSync(filePath, 'utf8');
    const compiled = hbs.create().handlebars.compile(templateContent);
    return compiled(data);
}

module.exports = router;
