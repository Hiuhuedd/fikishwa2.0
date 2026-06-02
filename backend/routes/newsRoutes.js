const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { verifyCustomer, verifyDriver } = require('../middleware/authMiddleware'); // We can make it public or authenticated

// Let's make it accessible to authenticated users (either driver or customer)
// But to keep it simple, we can just not use authMiddleware here if news is public, or check both.
// Assuming it's public for now, or you can add a simple middleware.
router.get('/', newsController.getNews);

module.exports = router;
