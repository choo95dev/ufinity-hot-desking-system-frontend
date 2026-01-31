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
