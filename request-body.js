// Generate random number and use it for MSISDN
function randNumber() {
    const minValue = 100000000;
    const maxValue = 999999999;
    const randomNumber = Math.abs(Math.floor(Math.random() * (minValue - maxValue + 1)) + minValue);

    return randomNumber;
}

// Generate random number and use it for MSISDN
function generateRandomNumberBetween(min, max) {
    console.log(`Will generate random whole number between: ${min} and ${max}.`);
    return Math.floor(Math.random() * (max + 1 - min) + min);
}

// Generate random number and use it for MSISDN
function generateRandomNumber(numLength = 6) {
    console.log(`Will generate random whole number with length: ${numLength} digits.`);
    let genratedNumber = '';
    for (let i = 0; i < numLength; i++) {
        genratedNumber += Math.floor(Math.random() * 10);
    }
    return genratedNumber;
};

// Generates random string that is set as unique referanceId
function stringGen(length) {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-!@#$%^&*()-=';
    var charLength = chars.length;
    var result = '';
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * charLength));
    }
    return result;
}

// Generates array of SMS request body objects with the length of 'size'
function generateSMSRequestBody(size, accountId, batchId, refferenceId, gateObj) {
    console.log('gateObj: ', gateObj);
    let requestBodyArray = [];
    let generatedMsisdn, generatedReferenceId;
    let obj;
    for (let i = 0; i < size ; i++) {
        generatedMsisdn = randNumber();
        generatedReferenceId = stringGen(10);
        obj = {
            recipient: `+47${ generatedMsisdn }`,
            content: {
                text: `#${ i + 1 } SMS CPaaS - acc: ${ accountId } - QA env - +47${ generatedMsisdn }`,
                options: {
                    "sms.sender": `${ batchId }`,
                    "sms.encoding": "AutoDetect"
                }
            },
            priority: "Normal",
            referenceId: `${ refferenceId }`
        };
        if (gateObj && gateObj !== null && typeof gateObj === 'object' && !Array.isArray(gateObj)) {
            obj.callback = gateObj;
        }
        requestBodyArray.push(obj);
    }
    return requestBodyArray;
};
const gate = {
    "mode": "Gate",
    "gateId": "gateId2",
    "ttl": 10000
};
console.log(generateSMSRequestBody(5, 'acc-ID-1', 'batch-ID-1', 'ref-ID-1', gate));
console.log(generateSMSRequestBody(5, 'acc-ID-2', 'batch-ID-2', 'ref-ID-2'));

// "callback": {
//     "mode": "Gate",
//     "gateId": "{{gateId2}}",
//     "ttl": 10000
// }