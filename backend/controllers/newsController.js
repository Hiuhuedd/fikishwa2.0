const newsService = require('../services/newsService');

exports.getNews = async (req, res) => {
    try {
        const newsList = await newsService.getNews(false); // Only return published news
        res.json({ success: true, news: newsList });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
