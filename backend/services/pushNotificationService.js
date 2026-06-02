const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send a push notification to a specific push token
 * @param {string} pushToken The Expo push token (e.g. ExponentPushToken[xxx])
 * @param {string} title The title of the notification
 * @param {string} body The body/message of the notification
 * @param {object} data Optional data payload to send with the notification
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
    if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`❌ Invalid Expo push token: ${pushToken}`);
        return false;
    }

    const messages = [{
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        priority: 'high',
        channelId: 'default',
    }];

    try {
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];
        
        // Send the chunks to the Expo push notification service
        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('❌ Error sending push notification chunk:', error);
            }
        }
        
        console.log('✅ Push notification sent successfully', tickets);
        return true;
    } catch (error) {
        console.error('❌ Failed to send push notification:', error);
        return false;
    }
};

module.exports = {
    sendPushNotification
};
