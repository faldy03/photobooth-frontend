const https = require('https');

const url = 'https://cdn.jsdelivr.net/gh/hafidznoor/idn-finlogos@master/icons/shopee-pay.svg';

https.get(url, (res) => {
  console.log(`SHOPEE-PAY STATUS: ${res.statusCode}`);
}).on('error', (err) => {
  console.error('Error:', err.message);
});
