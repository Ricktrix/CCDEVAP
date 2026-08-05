const express = require('express');
const router = express.Router();

const auditController = require('../controllers/auditController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', isAuthenticated, isAdmin, auditController.getAuditLogs);

router.get('/view', isAuthenticated, isAdmin, auditController.renderAuditLogs);

router.get('/search', isAuthenticated, isAdmin, auditController.searchAuditLogs);

router.get('/filter', isAuthenticated, isAdmin, auditController.filterAuditLogs);

router.get('/date', isAuthenticated, isAdmin, auditController.getAuditLogsByDate);

router.get('/:id', isAuthenticated, isAdmin, auditController.getAuditLogById);

module.exports = router;