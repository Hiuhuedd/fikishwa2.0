const axios = require('axios');

async function triggerMockRide() {
    try {
        const response = await axios.post('http://localhost:3000/api/test/mock-ride', {});
        console.log('Successfully triggered mock ride!');
        console.log('Payload:', response.data.data);
    } catch (error) {
        console.error('Error triggering mock ride:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

triggerMockRide();
