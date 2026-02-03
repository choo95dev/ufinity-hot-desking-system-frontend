/**
 * Extract date from datetime string
 * @param bookedAt - Datetime string in format "YYYY-MM-DD HH:MM AM/PM"
 * @returns Date in format "YYYY-MM-DD"
 */
export const extractDate = (bookedAt: string): string => bookedAt.split(" ")[0];

/**
 * Format Date object to YYYY-MM-DD string
 * @param date - Date object
 * @returns Formatted date string in YYYY-MM-DD format
 */
export const formatDateYmd = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

/**
 * Check if a date is a weekday (Monday-Friday)
 * @param date - Date object to check
 * @returns True if weekday, false if weekend
 */
export const isWeekday = (date: Date): boolean => {
	const day = date.getDay();
	return day !== 0 && day !== 6;
};

/**
 * Format time from ISO datetime string to time string (HH:MM AM/PM)
 * Treats database times as already being in local timezone (no conversion)
 * @param isoDatetime - ISO datetime string (e.g., "2026-02-04T09:00:00.000Z")
 * @returns Formatted time string (e.g., "09:00 AM")
 */
export const formatTime = (isoDatetime: string): string => {
	// Parse the ISO string and extract time components directly
	// This treats the UTC time as if it's already local time
	const date = new Date(isoDatetime);
	const hours = date.getUTCHours();
	const minutes = date.getUTCMinutes();
	
	// Format to 12-hour time with AM/PM
	const period = hours >= 12 ? 'PM' : 'AM';
	const displayHours = hours % 12 || 12;
	const displayMinutes = minutes.toString().padStart(2, '0');
	
	return `${displayHours.toString().padStart(2, '0')}:${displayMinutes} ${period}`;
};

/**
 * Format date from ISO datetime string to date string
 * Treats database dates as already being in local timezone (no conversion)
 * @param isoDatetime - ISO datetime string
 * @returns Formatted date string (e.g., "2/4/2026")
 */
export const formatDate = (isoDatetime: string): string => {
	const date = new Date(isoDatetime);
	const month = date.getUTCMonth() + 1;
	const day = date.getUTCDate();
	const year = date.getUTCFullYear();
	return `${month}/${day}/${year}`;
};

/**
 * Create ISO datetime string in UTC+8 timezone
 * @param date - Date string in YYYY-MM-DD format
 * @param time - Time string in HH:MM format (24-hour)
 * @returns ISO datetime string adjusted for UTC+8 (e.g., "2026-02-04T01:00:00.000Z" for 09:00 SGT)
 */
export const createUTC8DateTime = (date: string, time: string): string => {
	// Parse the date and time as if they are in UTC+8
	const dateTimeStr = `${date}T${time}:00`;
	
	// Create a date object treating the input as UTC+8
	// We need to subtract 8 hours to get the correct UTC time
	const localDate = new Date(dateTimeStr);
	const utcDate = new Date(localDate.getTime() - (8 * 60 * 60 * 1000));
	
	return utcDate.toISOString();
};
