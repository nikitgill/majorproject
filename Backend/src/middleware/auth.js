const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No authentication token, authorization denied' });
        }

        const token = authHeader.substring(7);


        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
