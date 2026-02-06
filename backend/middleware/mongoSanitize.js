// Custom NoSQL injection protection middleware for Express 5
// Sanitizes req.body, req.query, and req.params without replacing objects

const sanitizeValue = (value) => {
    if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.map(sanitizeValue);
        }

        const sanitized = {};
        for (const key in value) {
            // Remove keys that start with $ or contain .
            if (key.startsWith('$') || key.includes('.')) {
                console.warn(`Blocked potentially malicious NoSQL operator: ${key}`);
                continue;
            }
            sanitized[key] = sanitizeValue(value[key]);
        }
        return sanitized;
    }
    return value;
};

const mongoSanitize = () => {
    return (req, res, next) => {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeValue(req.body);
        }

        // Sanitize query params
        if (req.query && typeof req.query === 'object') {
            const sanitizedQuery = sanitizeValue(req.query);
            // Replace query object properties instead of the object itself
            Object.keys(req.query).forEach(key => delete req.query[key]);
            Object.assign(req.query, sanitizedQuery);
        }

        // Sanitize route params
        if (req.params && typeof req.params === 'object') {
            const sanitizedParams = sanitizeValue(req.params);
            Object.keys(req.params).forEach(key => delete req.params[key]);
            Object.assign(req.params, sanitizedParams);
        }

        next();
    };
};

module.exports = mongoSanitize;
