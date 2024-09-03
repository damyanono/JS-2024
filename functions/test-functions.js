'use strict';
const myMap1 = new Map();

function memoize(func) {
    const cache = new Map();

    return function (...args) {
        const key = JSON.stringify(args);

        if(cache.has(key)) {
            console.log('Fetching from cache', key);
            return cache.get(key);
        } else {
            console.log('Calculating result', key);
            const result = func(...args);
            cache.set(key, result);

            return result;
        }
    }
}

function iterateOverAllPages(i) {
    console.log('--- Iterate Over All Pages ---');
    console.log('myMap1 BEFORE: ', myMap1);
    console.table(myMap1);

    const currentMap = setMap({
        key: `KEY${ i }`,
        value: i
    });

    currentMap.forEach((value, key) => {
        console.log(`m[${key}] = ${value}`);
        myMap1.set(key, value);
    });

    console.log('myMap1 AFTER: ', myMap1);
    console.table(myMap1);
}

for (let i = 0; i < 5; i++) {
    console.log('--- MOST OUTER loop ---, i: ', i);
    iterateOverAllPages(myMap1, i);
    console.log('========== ========== ========== ========== ========== ==========');
}

// function iterateOverAllPages(myMap1, i) {
//     console.log('--- Iterate Over All Pages ---');
//     console.log('myMap1 BEFORE: ', myMap1);
//     console.table(myMap1);

//     const currentMap = setMap({
//         key: `KEY${ i }`,
//         value: i
//     });

//     currentMap.forEach((value, key) => {
//         console.log(`m[${key}] = ${value}`);
//         myMap1.set(key, value);
//     });

//     console.log('myMap1 AFTER: ', myMap1);
//     console.table(myMap1);
// }

// function setMap(item) {
//     const currentMap = new Map();
//     currentMap.set(item.key, item.value);
    
//     return currentMap;
// }

// console.log(myMap1);



// const fn = (() => {
// let lastArgs;
// return (...args) => {
//     console.log('function was called with args:', args);
//     console.log('past args were:', lastArgs);
//     lastArgs = args;
// };
// })();

// fn('foo', 'bar');
// fn('baz');

// function makeInjectContext(context) {
// return function (callback) {
//     return function (...args) {
//     let result = callback(...args)
//     if (typeof result === 'function') {
//         // Call it again and inject additional options
//         result = result(context)
//     }
//     return result
//     }
// }
// }