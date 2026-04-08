/**
 * Decodes a Google Maps encoded polyline string into an array of coordinates.
 * @param t Encoded polyline string
 * @returns Array of {latitude, longitude} objects
 */
export const decodePolyline = (t: string) => {
    let points = [];
    for (let step, i = 0, lat = 0, lng = 0; i < t.length;) {
        let b, shift = 0, result = 0;
        do {
            b = t.charCodeAt(i++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
        shift = 0;
        result = 0;
        do {
            b = t.charCodeAt(i++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
        points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
};
