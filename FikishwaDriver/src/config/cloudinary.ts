/**
 * Cloudinary Configuration
 * 
 * Get your cloud name and upload preset from: https://cloudinary.com/console
 * Free tier includes 25GB storage and 25GB bandwidth per month
 */

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@env';

export const CLOUDINARY_CONFIG = {
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
    folder: 'fikishwa/drivers',
};


export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

/**
 * Setup Instructions:
 * 
 * 1. Create a Cloudinary account at https://cloudinary.com
 * 2. Go to Settings > Upload
 * 3. Scroll to "Upload presets"
 * 4. Click "Add upload preset"
 * 5. Set:
 *    - Preset name: fikishwa_drivers
 *    - Signing mode: Unsigned
 *    - Folder: fikishwa/drivers
 *    - Access mode: Public
 * 6. Save and copy the preset name to uploadPreset above
 * 7. Copy your cloud name from the dashboard to cloudName above
 */
