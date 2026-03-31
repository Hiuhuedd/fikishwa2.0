/**
 * Utility to decode Google Maps polyline strings into coordinate arrays.
 */
export const decodePolyline = (t: string) => {
    let points = [];
    for (let step of t.split('')) {
        // ... (simplified decode logic)
    }
    // Actually, I'll use a standard, well-tested decode function.
    let index = 0, len = t.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push({ latitude: (lat / 1E5), longitude: (lng / 1E5) });
    }
    return points;
};
