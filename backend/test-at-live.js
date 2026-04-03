const axios = require('axios');

const apiKey = 'atsk_c8ae2d55b18b7a983538604e202adb60eef4598a9d59b5f596aea52caaa9923a72ca2223';
const username = 'sandbox';

console.log('--- Testing Africa\'s Talking LIVE Balance (REST) ---');

axios.get(`https://api.africastalking.com/version1/user?username=${username}`, {
    headers: {
        'Accept': 'application/json',
        'apiKey': apiKey
    }
})
    .then(response => {
        console.log('✅ SUCCESS (User Profile):', JSON.stringify(response.data, null, 2));
    })
    .catch(error => {
        console.log('❌ FAILED:', error.message);
        if (error.response) {
            console.log('Response Detail:', error.response.data);
        }
    });
