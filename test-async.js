'use strict';

async function customSleep(ms) {
    console.log('--- sleep() ---')
    return new Promise(resolve => setTimeout(resolve, ms));n
};


// async function customFunc() {
//     for (let i = 0; i < 5; i++) {
//         console.log('SLEEP');
//         await customSleep(5000);
//     }

//     console.log('OUT');
// }

(async function () {
    for (let i = 0; i < 5; i++) {
        console.log('SLEEP');
        await customSleep(5000);
    }

    console.log('OUT');
})();


// (async function () {
//     for await (const num of foo()) {
//       console.log(num);
//       // Expected output: 1
  
//       break; // Closes iterator, triggers return
//     }
// })();