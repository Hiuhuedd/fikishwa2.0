const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    // console.log(`Attempting to verify token for ${req.method} ${req.url}`);

    try {
        const secret = process.env.JWT_SECRET || 'fallback_secret_change_me';
        const decoded = jwt.verify(token, secret);
        req.user = decoded; // Contains uid, phone
        // console.log(`Token verified: ${decoded.uid} role: ${decoded.role}`);
        next();
    } catch (error) {
        console.error(`JWT verification failed for ${req.method} ${req.url}:`, error.message);
        return res.status(403).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
};

module.exports = verifyToken;
