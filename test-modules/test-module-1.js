'use strict';

let moduleOneString = 'Module #1 string';
let moduleOneArray = [ moduleOneString, 1, 2, 'Three'];

function moduleOneFunc (arg) {
    console.log('moduleOneFunc arg: ', arg);
}

export function abc() {
    console.log('ABC function here');
    return 'ABC';
}