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
 * Get auto freeze threshold from user override or return null
 * @deprecated Use getFreezeConfig instead
 * @returns {number|null} - Specific order count to freeze at, or null
 */
function resolveAutoFreezeThreshold(user) {
    const config = parseJsonField(user?.commissionConfig, {});
    if (config.autoFreezeThreshold != null) return Number(config.autoFreezeThreshold);
    return null;
}

/**
 * Get freeze configuration for user
 * Freeze only happens when admin explicitly enables it
 * @param {Object} user - User object with commissionConfig
 * @returns {{ enabled: boolean, mode: 'random'|'custom'|null, threshold: number|null, targetProductId: number|null }}
 */
function getFreezeConfig(user) {
    const config = parseJsonField(user?.commissionConfig, {});

    // Check if freeze is explicitly enabled by admin
    // Backward compatibility: if autoFreezeThreshold exists but no autoFreezeEnabled, treat as enabled with custom mode
    const hasLegacyThreshold = config.autoFreezeThreshold != null && config.autoFreezeThreshold > 0;
    const isEnabled = config.autoFreezeEnabled === true || hasLegacyThreshold;

    if (!isEnabled) {
        return { enabled: false, mode: null, threshold: null, targetProductId: null };
    }

    // Determine mode: 'random' (80-90%) or 'custom' (specific number)
    // Default to 'custom' for backward compatibility with existing configs
    const mode = config.autoFreezeMode || (hasLegacyThreshold ? 'custom' : 'random');

    return {
        enabled: true,
        mode: mode,
        threshold: config.autoFreezeThreshold != null ? Number(config.autoFreezeThreshold) : null,
        targetProductId: config.freezeTargetProductId != null ? Number(config.freezeTargetProductId) : null
    };
}

/**
 * Get start and end of day range for database queries (today)
 * @param {Date} d - Reference date
 * @returns {{ start: Date, end: Date }}
 */
function getTodayRange(d = new Date()) {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return { start, end };
}

module.exports = {
    hashPassword,
    comparePassword,
    excludeFromUser,
    parseJsonField,
    getDateKey,
    getTodayRange,
    resolveCommissionRate,
    resolveDailyTarget,
    resolveNumberOfOrders,
    resolveAutoFreezeThreshold,
    getFreezeConfig
};
