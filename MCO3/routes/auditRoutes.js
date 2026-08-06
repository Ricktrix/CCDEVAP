const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/auditController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', isAuthenticated, isAdmin, (req, res, next) => {
    console.log('Admin viewing audit logs.');
    AuditController.getAuditLogs(req, res, next);
});

module.exports = router;
