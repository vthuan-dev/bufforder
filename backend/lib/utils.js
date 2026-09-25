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

// Vietnam timezone is UTC+7
// Daily reset occurs at 14:00 (14h chiều) Vietnam time (UTC+7) = 07:00 UTC
const VN_TIMEZONE_OFFSET_HOURS = 7;
const RESET_HOUR_VN = 14;
const RESET_HOUR_UTC = (RESET_HOUR_VN - VN_TIMEZONE_OFFSET_HOURS + 24) % 24; // 7:00 UTC

/**
 * Get date key representing the daily cycle (resets at 14:00 VN time / 07:00 UTC)
 * @param {Date|string|number} d - Date object or timestamp
 * @returns {string} - Date key (YYYY-MM-DD)
 */
function getDateKey(d = new Date()) {
    const dateObj = d instanceof Date ? d : new Date(d);
    // Shift backward by RESET_HOUR_UTC so that 07:00 UTC (14:00 VN) aligns with start of cycle
    const shifted = new Date(dateObj.getTime() - RESET_HOUR_UTC * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
    const day = String(shifted.getUTCDate()).padStart(2, '0');
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
 * Get start and end of business day range for database queries
 * Daily cycle runs from 14:00:00 VN (07:00:00 UTC) to 14:00:00 VN next day (07:00:00 UTC)
 * @param {Date|string|number} d - Reference date
 * @returns {{ start: Date, end: Date }}
 */
function getTodayRange(d = new Date()) {
    const dateObj = d instanceof Date ? d : new Date(d);
    // Shift backward by RESET_HOUR_UTC (7 hours) to determine which cycle date we belong to
    const shifted = new Date(dateObj.getTime() - RESET_HOUR_UTC * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = shifted.getUTCMonth();
    const day = shifted.getUTCDate();

    // Start is 07:00:00.000 UTC (= 14:00:00 VN)
    const start = new Date(Date.UTC(y, m, day, RESET_HOUR_UTC, 0, 0, 0));
    // End is 07:00:00.000 UTC of next day (= 14:00:00 VN next day)
    const end = new Date(Date.UTC(y, m, day + 1, RESET_HOUR_UTC, 0, 0, 0));

    return { start, end };
}

module.exports = {
    VN_TIMEZONE_OFFSET_HOURS,
    RESET_HOUR_VN,
    RESET_HOUR_UTC,
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

