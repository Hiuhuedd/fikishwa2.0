/**
 * Role-based Access Control Middleware
 * @param {string} requiredRole - 'admin' | 'driver' | 'customer'
 */
const checkRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No user session found' });
        }

        if (req.user.role !== requiredRole) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: This action requires the ${requiredRole} role. Your current role is ${req.user.role || 'none'}.`
            });
        }

        next();
    };
};

module.exports = { checkRole };
