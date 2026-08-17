/**
 * Usage Tracker Service - Infrastructure Layer
 * 
 * Tracks and enforces daily BL upload limits using browser localStorage.
 * Limit: 5 extractions per day per browser.
 * Reset: Midnight local time (00:00 WIB).
 * 
 * @module infrastructure/services/usage-tracker
 */

/**
 * @typedef {Object} UsageData
 * @property {string} date - YYYY-MM-DD format
 * @property {number} count - Number of extractions today
 * @property {number} limit - Daily limit (5)
 */

/**
 * @typedef {Object} ExtractionError
 * @property {string} code - Machine-readable error code
 * @property {string} message - User-facing message in Bahasa Indonesia
 * @property {string} [technicalDetails] - Technical details for logging
 */

const STORAGE_KEY = 'bl_gemini_usage';
const DAILY_LIMIT = 5;

/**
 * Creates Usage Tracker Service
 * @returns {Object} Usage tracker interface
 */
export function createUsageTrackerService() {
  return {
    canExtract,
    incrementUsage,
    getUsageData,
    resetUsage
  };
}

/**
 * Checks if user can perform extraction today
 * @returns {Promise<{ ok: true, remaining: number } | { ok: false, error: ExtractionError }>}
 */
async function canExtract() {
  const data = await getUsageData();

  if (data.count >= data.limit) {
    const timeUntilReset = timeUntilMidnight();
    const hoursUntilReset = Math.ceil(timeUntilReset / (1000 * 60 * 60));

    return {
      ok: false,
      error: {
        code: 'DAILY_LIMIT_REACHED',
        message: 'Batas harian tercapai (5 BL per hari). Coba lagi besok ya.',
        technicalDetails: `Usage count: ${data.count}/${data.limit}, resets in ${hoursUntilReset} hours`
      }
    };
  }

  return {
    ok: true,
    remaining: data.limit - data.count
  };
}

/**
 * Increments usage count for today
 * @returns {Promise<void>}
 */
async function incrementUsage() {
  const data = await getUsageData();

  // Increment count
  data.count += 1;

  // Save to localStorage
  saveUsageData(data);

  console.log('[UsageTracker] Usage incremented', {
    count: data.count,
    limit: data.limit,
    remaining: data.limit - data.count
  });
}

/**
 * Gets current usage data for today
 * @returns {Promise<UsageData>}
 */
async function getUsageData() {
  const today = getTodayDate();
  const stored = loadUsageData();

  // Check if stored data is for today
  if (stored && isToday(stored.date)) {
    return stored;
  }

  // Create new data for today
  const newData = {
    date: today,
    count: 0,
    limit: DAILY_LIMIT
  };

  saveUsageData(newData);
  return newData;
}

/**
 * Resets usage count (called at midnight)
 * @returns {Promise<void>}
 */
async function resetUsage() {
  const today = getTodayDate();
  const newData = {
    date: today,
    count: 0,
    limit: DAILY_LIMIT
  };

  saveUsageData(newData);

  console.log('[UsageTracker] Usage reset for new day', {
    date: today
  });
}

/**
 * Gets today's date in YYYY-MM-DD format (WIB timezone)
 * @returns {string}
 */
function getTodayDate() {
  // WIB is UTC+7
  const now = new Date();
  const wibOffset = 7 * 60; // 7 hours in minutes
  const localOffset = now.getTimezoneOffset(); // Local offset in minutes (negative for ahead of UTC)
  const wibTime = new Date(now.getTime() + (wibOffset + localOffset) * 60 * 1000);

  const year = wibTime.getFullYear();
  const month = String(wibTime.getMonth() + 1).padStart(2, '0');
  const day = String(wibTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Loads usage data from localStorage
 * @returns {UsageData|null}
 */
function loadUsageData() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored);

    // Validate structure
    if (!data.date || typeof data.count !== 'number' || typeof data.limit !== 'number') {
      return null;
    }

    return data;
  } catch (error) {
    console.error('[UsageTracker] Error loading data', error);
    return null;
  }
}

/**
 * Saves usage data to localStorage
 * @param {UsageData} data
 * @returns {void}
 */
function saveUsageData(data) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[UsageTracker] Error saving data', error);
  }
}

/**
 * Checks if date is today
 * @param {string} date - YYYY-MM-DD
 * @returns {boolean}
 */
function isToday(date) {
  return date === getTodayDate();
}

/**
 * Calculates time until midnight WIB
 * @returns {number} - Milliseconds until reset
 */
function timeUntilMidnight() {
  const now = new Date();
  const wibOffset = 7 * 60; // 7 hours in minutes
  const localOffset = now.getTimezoneOffset();
  const wibTime = new Date(now.getTime() + (wibOffset + localOffset) * 60 * 1000);

  // Calculate midnight WIB
  const midnight = new Date(wibTime);
  midnight.setHours(24, 0, 0, 0);

  return midnight.getTime() - wibTime.getTime();
}

// Export singleton instance
export const usageTrackerService = createUsageTrackerService();
