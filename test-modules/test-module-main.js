import './test-module-1.js';

let obj1 = {
    name: 'some name',
    age: 99,
    friends: [
        {
            name: '1',
            age: 1
        },
        {
            name: '2',
            age: 3
        }
    ],
    father: {
        name: 'father',
        age: 77
    }
};

// let obj2 = obj1;
let obj2 = [obj1];
// obj2.push(obj1)

obj2[0].father.name = 'another father';

console.log('obj1: ', obj1);
console.log('obj2: ', obj2);