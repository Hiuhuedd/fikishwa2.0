const express = require('express');
const router = express.Router();
const adminNewsController = require('../controllers/adminNewsController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.use(verifyAdmin);

router.post('/', adminNewsController.createNews);
router.get('/', adminNewsController.getNews);
router.put('/:id', adminNewsController.updateNews);
router.delete('/:id', adminNewsController.deleteNews);

module.exports = router;
