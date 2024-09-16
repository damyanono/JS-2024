'use strict';
const headers = {
    'Authorization': 'Basic bWFzdGVyLXVzZXI6U0l3WDBhTnFBck5ZTVk2',
    'Date': 'Wed, 08 May 2024 10:59:43 GMT',
    'x-api-key': 'KEY',
    'Content-Type': 'application/json',
    'x-api-value': 'VALUE',
    'Content-Length': 1435,
    'Connection': 'keep-alive',
    'x-api-number': 'NUMBER'
};

const requestHeadersKeys = Object.keys(headers).filter(el => el.includes('x-api'));
console.log('requestHeaders: ', requestHeadersKeys, Array.isArray(requestHeadersKeys));
// const requestHeaderValues = headers[requestHeadersKeys];
const requestHeaderValues = headers[['x-api-key']];
console.log('headers: ', headers);
console.log('headerValue: ', requestHeaderValues);