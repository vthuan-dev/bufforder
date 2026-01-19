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

/**
 * Get YYYY-MM-DD date key
 * @param {Date} d - Date object
 * @returns {string} - Date key
 */
function getDateKey(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Get commission rate from user override or VIP level
 */
function resolveCommissionRate(user, vipLevel) {
    const config = parseJsonField(user?.commissionConfig, {});
    if (config.commissionRate != null) return Number(config.commissionRate);
    return vipLevel?.commissionRate || 0;
}

/**
 * Get daily target from user override or VIP level
 */
function resolveDailyTarget(user, vipLevel) {
    const config = parseJsonField(user?.commissionConfig, {});
    if (config.dailyTarget != null) return Number(config.dailyTarget);
    return vipLevel?.dailyTarget || 0;
}

/**
 * Get number of orders from user override or VIP level
 */
function resolveNumberOfOrders(user, vipLevel) {
    const config = parseJsonField(user?.commissionConfig, {});
    if (config.numberOfOrders != null) return Number(config.numberOfOrders);
    return vipLevel?.numberOfOrders || 100;
}

/**
 * Get auto freeze threshold from user override or return null (use default 80-90%)
 * @returns {number|null} - Specific order count to freeze at, or null for default behavior
 */
function resolveAutoFreezeThreshold(user) {
    const config = parseJsonField(user?.commissionConfig, {});
    if (config.autoFreezeThreshold != null) return Number(config.autoFreezeThreshold);
    return null; // Use default 80-90% calculation
}

module.exports = {
    hashPassword,
    comparePassword,
    excludeFromUser,
    parseJsonField,
    getDateKey,
    resolveCommissionRate,
    resolveDailyTarget,
    resolveNumberOfOrders,
    resolveAutoFreezeThreshold
};
