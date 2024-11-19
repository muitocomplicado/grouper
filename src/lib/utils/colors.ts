// Generate pastel colors using HSL
export function getFamilyNumberColor(number: number): string {
    // Use the number to generate a hue value (0-360)
    const hue = (number * 137.508) % 360; // Golden angle approximation for better distribution
    // Keep saturation and lightness high enough for pastel colors but ensuring readability
    return `hsl(${hue}, 70%, 85%)`;
}
