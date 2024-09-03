'use strict';

(() => {
    console.log('++++++ Reverse string #1. ++++++');

    const stringToReverse = 'String to reverse';
    const arrayFromString = stringToReverse.split('');
    const reversedArray = [];
    // for (let i = arrayFromString.length - 1; i >= 0; i--) {
    //     reversedArray.push(arrayFromString[i]);
    // }
    for (let i = 0; i < arrayFromString.length; i++) {
        reversedArray.push(arrayFromString[arrayFromString.length - i - 1]);
    }

    const reversedString = reversedArray.join('');
    console.log('reversedString: ', reversedString);
    console.log('');
})();

(() => {
    console.log('++++++ Reverse string #2. ++++++');

    const stringToReverse = 'String to reverse';
    const arrayFromString = stringToReverse.split('');
    let reversedString = '';
    
    for (let i = 0; i < arrayFromString.length; i++) {
        reversedString = reversedString + stringToReverse.charAt(arrayFromString.length - i - 1);
    }

    console.log('reversedString: ', reversedString);
    console.log('');
})();