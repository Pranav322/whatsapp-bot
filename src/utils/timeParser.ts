/**
 * Parse a time string into milliseconds
 * 
 * Supported formats:
 *   - 5s, 30s, etc. (seconds)
 *   - 5m, 30m, etc. (minutes)
 *   - 1h, 2h, etc. (hours)
 *   - 1h30m, 2h15m30s, etc. (combined)
 * 
 * @param timeString - The time string to parse
 * @returns The time in milliseconds, or null if invalid
 */
export function parseTimeString(timeString: string): number | null {
    if (!timeString || typeof timeString !== "string") {
        return null;
    }

    const input = timeString.toLowerCase().trim();

    // Check if the string only contains valid characters
    if (!/^[\d\shms]+$/.test(input)) {
        return null;
    }

    let totalMs = 0;

    // Match patterns like "1h", "30m", "45s"
    const hourMatch = input.match(/(\d+)\s*h/);
    const minuteMatch = input.match(/(\d+)\s*m(?!s)/); // Negative lookahead to avoid matching 'ms'
    const secondMatch = input.match(/(\d+)\s*s/);

    // If no valid time components found
    if (!hourMatch && !minuteMatch && !secondMatch) {
        return null;
    }

    if (hourMatch) {
        const hours = parseInt(hourMatch[1], 10);
        if (isNaN(hours) || hours < 0) return null;
        totalMs += hours * 60 * 60 * 1000;
    }

    if (minuteMatch) {
        const minutes = parseInt(minuteMatch[1], 10);
        if (isNaN(minutes) || minutes < 0) return null;
        totalMs += minutes * 60 * 1000;
    }

    if (secondMatch) {
        const seconds = parseInt(secondMatch[1], 10);
        if (isNaN(seconds) || seconds < 0) return null;
        totalMs += seconds * 1000;
    }

    // Don't allow zero or negative durations
    if (totalMs <= 0) {
        return null;
    }

    // Cap at 24 hours for safety
    const maxDuration = 24 * 60 * 60 * 1000; // 24 hours
    if (totalMs > maxDuration) {
        console.warn(`⚠️ Duration capped at 24 hours (requested: ${totalMs}ms)`);
        return maxDuration;
    }

    return totalMs;
}

/**
 * Format milliseconds into a human-readable duration string
 * 
 * @param ms - Duration in milliseconds
 * @returns Human-readable string like "1 hour 30 minutes"
 */
export function formatDuration(ms: number): string {
    if (ms <= 0) return "0 seconds";

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;

    const parts: string[] = [];

    if (hours > 0) {
        parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    }
    if (remainingMinutes > 0) {
        parts.push(`${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`);
    }
    if (remainingSeconds > 0 && hours === 0) {
        // Only show seconds if less than an hour
        parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`);
    }

    return parts.join(" ") || "0 seconds";
}
