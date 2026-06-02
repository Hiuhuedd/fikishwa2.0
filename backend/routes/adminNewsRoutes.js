const express = require('express');
const router = express.Router();
const adminNewsController = require('../controllers/adminNewsController');
const verifyToken = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

router.use(verifyToken);
router.use(checkRole('admin'));

router.post('/', adminNewsController.createNews);
router.get('/', adminNewsController.getNews);
router.put('/:id', adminNewsController.updateNews);
router.delete('/:id', adminNewsController.deleteNews);

module.exports = router;
