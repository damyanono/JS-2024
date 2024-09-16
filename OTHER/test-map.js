'use strict';

(function () {
    let myMap = new Map();
    myMap.set('msg-id-#1', false);
    myMap.set('msg-id-#2', true);
    myMap.set('msg-id-#3', false);

    console.log('myMap: ', myMap);

    myMap.forEach((key, value) => {
        console.log(`key: ${key} - value: ${value}`);
        console.log(`whole map 1: ${ JSON.stringify(Array.from(myMap.entries())) }`);
        console.log(`whole map 2: ${ JSON.stringify([...myMap]) }`);
        console.log(`whole map 3: ${ JSON.stringify(Object.fromEntries(myMap)) }`);
    });
})();

export const assertMessageIDsDeliveredStatus = (messageIds) => {
 
    messageIds.forEach(function(value, key) {
        console.log('Map: ',key + " = " + value)
            
 
        console.log(value);
    })
 
    }