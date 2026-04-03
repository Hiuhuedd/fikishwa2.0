const credentials = {
    apiKey: 'atsk_c8ae2d55b18b7a983538604e202adb60eef4598a9d59b5f596aea52caaa9923a72ca2223',
    username: 'sandbox'
};

const AfricasTalking = require('africastalking')(credentials);
const sms = AfricasTalking.SMS;

console.log('--- Testing Africa\'s Talking Sandbox ---');
sms.send({
    to: ['+254743466032'],
    message: 'Fikishwa Test OTP'
})
    .then(response => {
        console.log('✅ SUCCESS:', JSON.stringify(response, null, 2));
    })
    .catch(error => {
        console.log('❌ FAILED:', error.message);
        if (error.response) {
            console.log('Response Detail:', error.response.data);
        }
    });
