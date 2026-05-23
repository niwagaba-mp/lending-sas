const fs = require('fs');
const path = require('path');
const { getSCPData } = require('../services/scpDataBindingService');

/**
 * Controller to handle SCP document generation and PDF export.
 */
async function generateSCPReport(req, res) {
    try {
        const { loanId, docType } = req.params;
        const tenantId = req.user.tenant_id;

        // 1. Gather Payload
        const payload = await getSCPData(loanId, tenantId);

        // 2. Determine Template
        let templateFileName;
        if (docType === 'tripartite') {
            templateFileName = 'TripartiteCommitment.html';
        } else if (docType === 'statutory-notice') {
            templateFileName = 'StatutoryDemandNotice.html';
        } else {
            return res.status(400).json({ error: 'Invalid document type. Use "tripartite" or "statutory-notice".' });
        }

        const templatePath = path.join(__dirname, '../templates', templateFileName);
        const stylePath = path.join(__dirname, '../styles', 'legal-print.css');

        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ error: 'Template file not found' });
        }

        // 3. Bind Data to Template
        let htmlContent = fs.readFileSync(templatePath, 'utf8');
        let cssContent = fs.readFileSync(stylePath, 'utf8');

        // Simple variable replacement
        Object.keys(payload).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            htmlContent = htmlContent.replace(regex, payload[key]);
        });

        // 4. Wrap in Full HTML with Scoped CSS
        const fullHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Legal Document - ${docType}</title>
                <style>
                    ${cssContent}
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `;

        // 5. Return as PDF (Note: Assuming a PDF rendering library would convert this HTML to PDF)
        // For now, we return HTML with a header suggesting it's for print/PDF conversion.
        // In a real production environment with puppeteer/html-pdf-node installed, 
        // we would use the library here to generate and send a Buffer.
        
        res.setHeader('Content-Type', 'text/html');
        // res.setHeader('Content-Disposition', `attachment; filename="${docType}-${loanId}.pdf"`);
        
        res.send(fullHtml);

    } catch (error) {
        console.error('[SCP_REPORT_ERROR]', error);
        res.status(500).json({ error: 'Failed to generate legal document', detail: error.message });
    }
}

module.exports = { generateSCPReport };
