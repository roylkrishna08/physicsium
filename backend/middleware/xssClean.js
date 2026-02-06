const xssFilters = require('xss-filters');

/**
 * Clean data to prevent XSS attacks
 * @param {any} data - Data to clean
 * @returns {any} - Cleaned data
 */
const clean = (data = '') => {
    let isObject = false;
    if (typeof data === 'object' && data !== null) {
        data = JSON.stringify(data);
        isObject = true;
    }

    // Use xss-filters to sanitize HTML data
    // Note: We're mimicking xss-clean behavior here to maintain functionality
    data = xssFilters.inHTMLData(data).trim();

    if (isObject) {
        try {
            data = JSON.parse(data);
        } catch (e) {
            console.error('Error parsing sanitized JSON:', e);
        }
    }

    return data;
};

/**
 * XSS middleware for Express 5
 * Sanitizes req.body, req.query, and req.params in-place to avoid read-only property errors
 */
const xssClean = () => {
    return (req, res, next) => {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
            const sanitizedBody = clean(req.body);
            Object.keys(req.body).forEach(key => delete req.body[key]);
            Object.assign(req.body, sanitizedBody);
        }

        // Sanitize query params (Crucial for Express 5)
        if (req.query && typeof req.query === 'object') {
            const sanitizedQuery = clean(req.query);
            // Modify properties in-place to avoid "Cannot set property query" error
            Object.keys(req.query).forEach(key => delete req.query[key]);
            Object.assign(req.query, sanitizedQuery);
        }

        // Sanitize route params
        if (req.params && typeof req.params === 'object') {
            const sanitizedParams = clean(req.params);
            Object.keys(req.params).forEach(key => delete req.params[key]);
            Object.assign(req.params, sanitizedParams);
        }

        next();
    };
};

module.exports = xssClean;
