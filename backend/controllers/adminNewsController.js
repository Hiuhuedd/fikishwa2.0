const newsService = require('../services/newsService');

exports.createNews = async (req, res) => {
    try {
        const data = req.body;
        const adminId = req.user.uid;
        const result = await newsService.createNews(data, adminId);
        res.status(201).json({ success: true, news: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getNews = async (req, res) => {
    try {
        const newsList = await newsService.getNews(true);
        res.json({ success: true, news: newsList });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const adminId = req.user.uid;
        const result = await newsService.updateNews(id, data, adminId);
        res.json({ success: true, news: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        await newsService.deleteNews(id);
        res.json({ success: true, message: 'News deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
