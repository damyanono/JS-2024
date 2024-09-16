function convertToISOTimestamp(timeStampToFormat) {
        
    const timeStampToBeFormated = timeStampToFormat;
    const periodDate = timeStampToBeFormated.split('T')[0];
    const periodTime = timeStampToBeFormated.split('T')[1];
    const periodTimeSplit = periodTime.split(':');
    const seconds = periodTimeSplit[2].split('.')[0];
    const miliseconds = periodTimeSplit[2].split('.')[1];

    let realSeconds = seconds;
    let realMiliseconds = `000Z`;

    if (miliseconds) {
        const milisecondsArr = miliseconds.slice(0, 3).split('');
        const realMilisecondsArr = replaceElementInArray(milisecondsArr, 3, 'Z', '0');
        realMiliseconds = `${ realMilisecondsArr.join('') }Z`;
    } else {
        const secondsArr = seconds.slice(0, 2).split('');
        const realSecondsArr = replaceElementInArray(secondsArr, 2, 'Z', '0');
        realSeconds = `${ realSecondsArr.join('') }`;
    } 
    
    return `${ periodDate }T${ periodTimeSplit[0] }:${ periodTimeSplit[1] }:${ realSeconds }.${ realMiliseconds }`;
}

function replaceElementInArray(entryArray, outputArrayLength, pivotSymbol, symbolToReplaceWith) {
    let outputArray = [...entryArray];

    for (let i = 0; i < outputArrayLength; i++) {
        if (outputArray[i] === pivotSymbol) {
            outputArray[i] = symbolToReplaceWith;
        } else if (!outputArray[i]) {
            outputArray.push(symbolToReplaceWith);
        }
    }

    return outputArray;
}

// 2024-09-12T07:13:44.1Z
// 2024-09-13T08:22:00.751Z
// 2024-09-12T07:12:20Z
// <yyyy-MM-ddTHH:mm:ss.fffZ>"
const time = convertToISOTimestamp('2024-09-12T07:13:44.1Z');
const time2 = convertToISOTimestamp('2024-09-12T07:13:04.11Z');
const time3 = convertToISOTimestamp('2024-09-12T07:13:44.011Z');
const time4 = convertToISOTimestamp('2024-09-12T07:12:20Z');
const time5 = convertToISOTimestamp('2024-09-12T07:12:30');
console.log(time);
console.log(time2);
console.log(time3);
console.log(time4);
console.log(time5);