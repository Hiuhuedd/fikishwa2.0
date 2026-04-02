const axios = require('axios');
const { getFirestoreApp } = require('../firebase');
const { collection, addDoc, Timestamp } = require('firebase/firestore');

class SMSService {
    constructor() {
        console.log('🚀 Initializing SMS Service...');
        this.db = getFirestoreApp();

        // General config
        this.config = {
            provider: process.env.SMS_PROVIDER || 'africastalking', // 'textsms' or 'africastalking'

            // TextSMS
            textSmsApiKey: process.env.TEXTSMS_API_KEY,
            textSmsPartnerID: process.env.TEXTSMS_PARTNER_ID,
            textSmsShortcode: process.env.TEXTSMS_SENDER_ID || 'TextSMS',
            textSmsUrl: process.env.TEXTSMS_API_URL || 'https://sms.textsms.co.ke/api/services/sendsms/',

            // Africa's Talking
            atUsername: process.env.AT_USERNAME || 'sandbox',
            atApiKey: process.env.AT_API_KEY,
            atSenderId: process.env.AT_SENDER_ID || null
        };

        console.log(`📋 SMS Service Configuration - Active Provider: [${this.config.provider.toUpperCase()}]`);

        // Initialize Africa's Talking Native SDK
        if (this.config.atApiKey) {
            const credentials = { apiKey: this.config.atApiKey, username: this.config.atUsername };
            try {
                this.sms = require('africastalking')(credentials).SMS;
            } catch (e) {
                console.warn("⚠️ Africa's Talking Initialization failed:", e.message);
            }
        } else {
            console.warn("⚠️ Africa's Talking API Key not found");
        }

        if (!this.config.textSmsApiKey) {
            console.warn("⚠️ TextSMS API Key not found");
        }
    }

    normalizePhone(phone) {
        let p = phone.replace(/\s+/g, '');
        if (p.startsWith('+254')) return p.substring(1);
        if (p.startsWith('07') || p.startsWith('01')) return '254' + p.substring(1);
        if (p.startsWith('254')) return p;
        if (p.startsWith('7') || p.startsWith('1')) return '254' + p;
        return p;
    }

    async sendSMS(phone, message, triggeredBy = "system", category = "general") {
        const normalizedPhone = this.normalizePhone(phone);
        const startTime = Date.now();
        let status = 'failed';
        let apiResponse = null;
        let errorMsg = null;

        if (message.length > 160) {
            console.warn(`⚠️ Message exceeds 160 characters (${message.length}), API will split it.`);
        }

        try {
            if (this.config.provider === 'africastalking') {
                if (!this.sms) throw new Error("Africa's Talking SDK not initialized");

                console.log(`📨 Sending SMS to +${normalizedPhone} [Category: ${category}] via Africa's Talking`);
                const options = {
                    to: [`+${normalizedPhone}`],
                    message: message,
                };
                if (this.config.atSenderId && this.config.atUsername !== 'sandbox') {
                    options.from = this.config.atSenderId;
                }
                const response = await this.sms.send(options);
                apiResponse = response;
                const recipientData = response?.SMSMessageData?.Recipients?.[0];
                if (recipientData && recipientData.status === 'Success') {
                    status = 'success';
                    console.log('✅ SMS sent successfully via AT:', response);
                } else {
                    console.warn('⚠️ AT SMS partial failure or rejection:', response);
                }

            } else {
                // Fallback to TextSMS
                console.log(`📨 Sending SMS to ${normalizedPhone} [Category: ${category}] via TextSMS`);
                const payload = {
                    apikey: this.config.textSmsApiKey,
                    partnerID: this.config.textSmsPartnerID,
                    message: message,
                    shortcode: this.config.textSmsShortcode,
                    mobile: normalizedPhone
                };
                const response = await axios.post(this.config.textSmsUrl, payload);
                apiResponse = response.data;
                status = 'success';
                console.log('✅ SMS sent successfully via TextSMS:', apiResponse);
            }
        } catch (error) {
            console.error('❌ SMS send failed:', error.message);
            errorMsg = error.message;
            if (error.response) {
                apiResponse = error.response.data || error.response;
            }
        } finally {
            // Log to Firestore using Client SDK
            try {
                await addDoc(collection(this.db, 'sms_logs'), {
                    phone: normalizedPhone,
                    originalPhone: phone,
                    message: message,
                    category: category,
                    status: status,
                    triggeredBy: triggeredBy,
                    sentAt: Timestamp.now(),
                    durationMs: Date.now() - startTime,
                    providerResponse: apiResponse || {},
                    error: errorMsg || null,
                    partnerId: this.config.partnerID || 'UNKNOWN'
                });
            } catch (logError) {
                console.error('⚠️ Failed to save SMS log to Firestore:', logError.message);
            }
        }
    }

    /**
     * Generate and send trip completion SMS with bill summary
     */
    async sendTripCompletionSMS(rideData, customerPhone, driverName) {
        try {
            const pickupAddr = rideData.pickup.address || 'Pickup location';
            const dropoffAddr = rideData.dropoff.address || 'Drop-off location';
            const distanceKm = rideData.actualDistanceKm || rideData.distanceKm || 0;
            const durationMin = rideData.actualDurationMin || rideData.durationMin || 0;
            const finalFare = rideData.finalFare || rideData.estimatedFare || 0;
            const paymentMethod = rideData.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash';

            const message = `Thank you for riding with Fikishwa!

Trip: ${pickupAddr} → ${dropoffAddr}
Distance: ${distanceKm} km | Time: ${durationMin} min
Final Fare: KES ${finalFare} (${paymentMethod})
Driver: ${driverName}

Rate your experience in the app ⭐⭐⭐⭐⭐`;

            await this.sendSMS(customerPhone, message, 'system', 'ride_completion');
            console.log('✅ Trip completion SMS sent successfully');
        } catch (error) {
            console.error('❌ Failed to send trip completion SMS:', error.message);
            // Don't throw - we don't want to block ride completion if SMS fails
        }
    }

    /**
     * Send commission reminder SMS to driver
     */
    async sendCommissionReminderSMS(driverPhone, driverName, owedAmount, threshold, type = 'REMINDER') {
        try {
            let message = '';

            if (type === 'DISABLED') {
                message = `Dear ${driverName},

Your Fikishwa driver account has been DISABLED.

Outstanding Commission: KES ${owedAmount}
Maximum Allowed: KES ${threshold}

Please pay to Paybill: FIKISHWA_PAYBILL
Account: ${driverPhone}

Contact support for assistance.`;
            } else if (type === 'REMINDER') {
                message = `Dear ${driverName},

Commission Reminder - Fikishwa

Outstanding Amount: KES ${owedAmount}
Alert Threshold: KES ${threshold}

Please settle soon to avoid account suspension.
Paybill: FIKISHWA_PAYBILL
Account: ${driverPhone}`;
            } else {
                message = `Dear ${driverName},

Your Fikishwa commission balance is KES ${owedAmount}.

Pay to Paybill: FIKISHWA_PAYBILL
Account: ${driverPhone}`;
            }

            await this.sendSMS(driverPhone, message, 'system', 'commission_reminder');
            console.log(`✅ Commission reminder SMS sent to ${driverName}`);
        } catch (error) {
            console.error('❌ Failed to send commission reminder SMS:', error.message);
            // Don't throw - SMS failure shouldn't block the process
        }
    }

    /**
     * Generate and send driver approval SMS
     */
    async generateDriverApprovalSMS(driverName, driverPhone) {
        try {
            const message = `Congratulations ${driverName}! Your Fikishwa driver account has been APPROVED. 
You can now go online in the app and start earning. Welcome to the team!`;

            await this.sendSMS(driverPhone, message, 'admin', 'driver_approval');
            console.log(`✅ Driver approval SMS sent to ${driverName}`);
        } catch (error) {
            console.error('❌ Failed to send driver approval SMS:', error.message);
        }
    }

    /**
     * Generate and send driver rejection SMS
     */
    async generateDriverRejectionSMS(driverName, driverPhone, reason) {
        try {
            const message = `Dear ${driverName}, 
Your Fikishwa driver application was not approved. 
Reason: ${reason}
Please fix the issue and resubmit your documents. Thank you.`;

            await this.sendSMS(driverPhone, message, 'admin', 'driver_rejection');
            console.log(`✅ Driver rejection SMS sent to ${driverName}`);
        } catch (error) {
            console.error('❌ Failed to send driver rejection SMS:', error.message);
        }
    }

    /**
     * Send specific document feedback SMS
     */
    async generateDocumentFeedbackSMS(driverName, driverPhone, documentLabel, status, reason) {
        try {
            let message = '';
            if (status === 'rejected') {
                message = `Dear ${driverName}, your uploaded "${documentLabel}" was REJECTED.
Reason: ${reason || 'Incomplete or invalid'}
Please upload a clear copy in the app.`;
            } else if (status === 'approved') {
                message = `Dear ${driverName}, your "${documentLabel}" has been VERIFIED. Status: APPROVED.`;
            }

            if (message) {
                await this.sendSMS(driverPhone, message, 'admin', 'document_feedback');
                console.log(`✅ Document feedback SMS (${status}) sent to ${driverName}`);
            }
        } catch (error) {
            console.error('❌ Failed to send document feedback SMS:', error.message);
        }
    }

    /**


    /**
     * Send referral bonus SMS
     */
    async generateReferralBonusSMS(userName, userPhone, amount) {
        try {
            const message = `Great news ${userName}! Your friend joined Fikishwa using your referral code. 
You both earned KES ${amount} off your next ride!`;

            await this.sendSMS(userPhone, message, 'system', 'referral_bonus');
        } catch (error) {
            console.error('❌ Failed to send referral bonus SMS:', error.message);
        }
    }

    /**
     * Send promo applied SMS
     */
    async generatePromoAppliedSMS(userPhone, discount) {
        try {
            const message = `Promo applied! You saved KES ${discount} on this ride. Thank you for riding with Fikishwa!`;

            await this.sendSMS(userPhone, message, 'system', 'promo_application');
        } catch (error) {
            console.error('❌ Failed to send promo applied SMS:', error.message);
        }
    }

    /**
     * Send driver bonus SMS
     */
    /**
     * Send driver bonus SMS
     */
    async generateDriverBonusSMS(driverName, driverPhone, amount, trips) {
        try {
            const message = `Congratulations ${driverName}! You completed ${trips} trips this week and earned a KES ${amount} bonus. Keep going!`;

            await this.sendSMS(driverPhone, message, 'system', 'driver_bonus');
        } catch (error) {
            console.error('❌ Failed to send driver bonus SMS:', error.message);
        }
    }

    /**
     * Send Parcel Incoming SMS to receiver
     */
    async generateParcelIncomingSMS(receiverName, receiverPhone, senderName, trackingLink) {
        try {
            const message = `Hello ${receiverName}, a parcel from ${senderName} is on its way! Track it here: ${trackingLink}`;
            await this.sendSMS(receiverPhone, message, 'system', 'parcel_incoming');
        } catch (error) {
            console.error('❌ Failed to send parcel incoming SMS:', error.message);
        }
    }

    /**
     * Send Delivery OTP SMS to receiver
     */
    async generateDeliveryOTPSMS(receiverPhone, otp) {
        try {
            const message = `Your Fikishwa delivery code is: ${otp}. Please share this with the driver only upon receipt of your package.`;
            await this.sendSMS(receiverPhone, message, 'system', 'delivery_otp');
        } catch (error) {
            console.error('❌ Failed to send delivery OTP SMS:', error.message);
        }
    }

    /**
     * Send Parcel Delivered SMS to sender
     */
    async generateParcelDeliveredSMS(senderName, senderPhone, receiverName, proofLink) {
        try {
            const message = `Good news ${senderName}! Your parcel to ${receiverName} has been delivered successfully. View proof: ${proofLink}`;
            await this.sendSMS(senderPhone, message, 'system', 'parcel_delivered');
        } catch (error) {
            console.error('❌ Failed to send parcel delivered SMS:', error.message);
        }
    }
}

module.exports = new SMSService();
