const User = require('../models/User');

/**
 * Suggests available usernames based on a desired username
 * @param {string} username - Desired username
 * @returns {Promise<string[]>} - Array of suggested usernames
 */
const suggestUsernames = async (username) => {
    const suggestions = [];
    const base = username.toLowerCase();

    // Try adding numbers or variations
    const variants = [
        `${base}${Math.floor(Math.random() * 100)}`,
        `${base}_${Math.floor(Math.random() * 999)}`,
        `${base}${new Date().getFullYear()}`,
        `the_${base}`,
        `${base}_official`
    ];

    for (const variant of variants) {
        const exists = await User.findOne({ username: variant });
        if (!exists) {
            suggestions.push(variant);
        }
        if (suggestions.length >= 3) break;
    }

    return suggestions;
};

module.exports = suggestUsernames;
