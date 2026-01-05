/**
 * Format currency value
 * @param value Number to format
 * @param currency Currency symbol (default: '')
 */
export const formatCurrency = (value: number, currency: string = ''): string => {
    // If value is undefined or null, return 0
    if (value === undefined || value === null) return '0.00';

    return currency + value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

/**
 * Format date to readable string
 * @param dateStr ISO date string
 */
export const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
};
