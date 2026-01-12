const bcrypt = require('bcryptjs');

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Compare a plain password with a hashed password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - True if passwords match
 */
async function comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Exclude keys from user object (remove sensitive data)
 * @param {Object} user - User object
 * @param {Array<string>} keys - Keys to exclude
 * @returns {Object} - User object without excluded keys
 */
function excludeFromUser(user, keys = ['password']) {
    const result = { ...user };
    keys.forEach(key => delete result[key]);
    return result;
}

/**
 * Parse JSON field safely
 * @param {any} jsonField - JSON field value
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} - Parsed value or default
 */
function parseJsonField(jsonField, defaultValue = {}) {
    if (!jsonField) return defaultValue;
    if (typeof jsonField === 'object') return jsonField;
    try {
        return JSON.parse(jsonField);
    } catch {
        return defaultValue;
    }
}

module.exports = {
    hashPassword,
    comparePassword,
    excludeFromUser,
    parseJsonField
};
