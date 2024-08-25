import { cubicOut } from 'svelte/easing';

/**
 * Transforms a given text into a URL-friendly string.
 *
 * @param {string} text - The input text to be transformed.
 * @returns {string} The transformed URL-friendly string.
 *
 * The function performs the following operations:
 * - Converts the input text to lowercase.
 * - Replaces all whitespace characters with hyphens.
 * - Removes any non-alphanumeric characters except hyphens.
 * - If the resulting string exceeds 100 characters, it truncates it to 100 characters.
 * - Removes any trailing hyphens.
 */
export function transformTextToURL(text) {
    let url = text.toLowerCase();
    url = url.replace(/\s+/g, '-');
    url = url.replace(/[^\w\-]+/g, '');

    if (url.length > 100) {
        url = url.substring(0, 100);
    }

    url = url.replace(/\-+$/, '');

    return url;
}

/**
 * Converts a timestamp into a human-readable date string.
 *
 * @param {number} timestamp - The timestamp to be converted.
 * @returns {string} The human-readable date string in the format determined by the user's locale.
 *
 * This function takes a timestamp as input and converts it into a human-readable date string using the
 * `toLocaleDateString()` method of the JavaScript `Date` object. The date string is formatted according to
 * the user's locale settings.
 */
export function toReadableDate(timestamp) {
    const date = new Date(timestamp);
    const readableDate = date.toLocaleDateString();
    return readableDate;
}