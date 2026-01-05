/**
 * Mapbox Configuration
 * 
 * Get your access token from: https://account.mapbox.com/access-tokens/
 * Free tier includes 50,000 map loads per month
 */

import { MAPBOX_ACCESS_TOKEN as ENV_MAPBOX_TOKEN } from '@env';

export const MAPBOX_ACCESS_TOKEN = ENV_MAPBOX_TOKEN;


export const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/streets-v12';

// Alternative style options:
// - 'mapbox://styles/mapbox/dark-v11' (Dark mode)
// - 'mapbox://styles/mapbox/light-v11' (Light mode)
// - 'mapbox://styles/mapbox/outdoors-v12' (Outdoors)
// - 'mapbox://styles/mapbox/satellite-streets-v12' (Satellite)

export const MAPBOX_CONFIG = {
    defaultZoom: 15,
    defaultPitch: 0,
    defaultBearing: 0,
    animationDuration: 1000,
};
