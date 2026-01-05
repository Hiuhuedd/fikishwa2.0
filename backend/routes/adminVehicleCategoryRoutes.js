const express = require('express');
const router = express.Router();
const adminVehicleCategoryController = require('../controllers/adminVehicleCategoryController');
const verifyToken = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All routes require admin authentication
router.use(verifyToken);
router.use(checkRole('admin'));

router.get('/', adminVehicleCategoryController.getAllCategories);
router.post('/create', adminVehicleCategoryController.createCategory);
router.post('/:categoryId/update', adminVehicleCategoryController.updateCategory);
router.post('/:categoryId/toggle', adminVehicleCategoryController.toggleCategory);

module.exports = router;
