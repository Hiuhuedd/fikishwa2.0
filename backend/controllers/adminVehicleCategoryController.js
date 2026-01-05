const vehicleCategoryService = require('../services/vehicleCategoryService');

exports.createCategory = async (req, res) => {
    try {
        const category = await vehicleCategoryService.createCategory(req.body);
        res.json({ success: true, message: 'Category saved successfully', category });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await vehicleCategoryService.getAllCategories();
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.toggleCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { active } = req.body;
        await vehicleCategoryService.toggleCategory(categoryId, active);
        res.json({ success: true, message: `Category ${active ? 'activated' : 'deactivated'}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const updateData = { ...req.body, categoryId };
        const category = await vehicleCategoryService.createCategory(updateData);
        res.json({ success: true, message: 'Category updated successfully', category });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
