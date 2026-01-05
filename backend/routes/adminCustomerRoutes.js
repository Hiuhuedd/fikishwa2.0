const express = require('express');
const router = express.Router();
const adminCustomerController = require('../controllers/adminCustomerController');
const verifyToken = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All routes require admin authentication
router.use(verifyToken);
router.use(checkRole('admin'));

router.get('/all', adminCustomerController.getAllCustomers);

module.exports = router;
