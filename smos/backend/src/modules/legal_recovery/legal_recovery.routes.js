const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { generateSCPReport } = require('./controllers/scpReportController');

const router = express.Router();

/**
 * Isolated routes for the Legal Recovery module.
 * Handled under /api/legal-recovery
 */

// Step 6: handle the API endpoint (e.g., GET /api/legal-recovery/:loanId/:docType)
router.get('/:loanId/:docType', authenticate, generateSCPReport);

module.exports = router;
