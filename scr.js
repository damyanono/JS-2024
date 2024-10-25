'use strict';
import pactum from 'pactum';
import * as fs from 'fs';
import * as util from 'util';
import * as stream from 'stream';
import config from '../config.js';

const finished = util.promisify(stream.finished);

// TODO: this file could be separated into modules !
// MAIN METHODS HERE:
async function getAllMessageSearchResults(
    outerLoopParams, 
    messageSearchParams,
    gatherParams,
    gaterResultPerItem, // could be ...gaterResultMethods
    outputFileURL,
    ...writeMethods
) {
    console.log(`--- Get All Message Search Results ---`);
    console.log('loopParams: ', outerLoopParams);
    console.log('searchParams: ', messageSearchParams);
    console.log('gaterResultPerItem: ', gaterResultPerItem);

    console.log('writeMethods 0: ', writeMethods[0]);
    console.log('writeMethods 1: ', await writeMethods[1]);

    let loopParams = deepCloneObject(outerLoopParams);
    let searchParams = deepCloneObject(messageSearchParams);
    let allMessagesWithEqualTimestamp = new Map([['currentItems[it].messageId', 'currentItems[it].summary.queued']]);

    // WRITE
    const allWriteMethods = await Promise.all(
            writeMethods.map(async (currentWriteMethod) => { // Promise.allSettled does not fail when 1 of the promises fail
                console.log('currentWriteMethod IN: ', currentWriteMethod);
                return await currentWriteMethod(outputFileURL);
            })
    );
    console.log('allWriteMethods: ', allWriteMethods);


    let OUT_OUT = []; // please rename !
    let writeOutput = [];

    for (let loop = 0; loop < loopParams.totalNumberOfRecords; loop += loopParams.messageSearchStep) {
        console.log(`////// - ${ searchParams.startPeriod } - //////`);

        // INITIAL REQUEST
        const messageSearchResponse = await pactum.spec()
            .use('Send COMMON GET request and return response', {
                requestURL: searchParams.getRequestURL(),
                token: config.globals.TOKEN, // SHOULD NOT be stored to global object at all
                name: 'MSG Search (Initial Request)'
            });

        const pageParams = {
            pagesCount: parseInt(messageSearchResponse.body.pages),
            pageStep: loopParams.pageStep
        };

        console.log(`INITIAL MSG SEARCH RESPONSE: 
            loop: ${ loop },
            total results: ${ messageSearchResponse.body.results },
            results per page: ${ messageSearchResponse.body.resultsPerPage },
            current page: ${ messageSearchResponse.body.currentPage }`
        );

        // ITERATE OVER ALL PAGES
        const iterateOverAllPagesRESULT = await iterateOverAllPagesAndGetResult(
            allMessagesWithEqualTimestamp,
            loopParams,
            searchParams,
            pageParams,
            gatherParams,
            gaterResultPerItem,
        );

        console.log('iterateOverAllPagesRESULT: ', iterateOverAllPagesRESULT);

        // Update messages with equal timestamp Map
        allMessagesWithEqualTimestamp = new Map(iterateOverAllPagesRESULT.currentTimestampsMAP);

        // Update start period
        searchParams.startPeriod = iterateOverAllPagesRESULT.latestStartPeriod; // TODO: could think of updateRequestURL() method

        // Update current 10K results
        const current10KResults = iterateOverAllPagesRESULT.resultsGatheredFrom10K;

        // SAVE RESULTS
        
        if (current10KResults && current10KResults.length) {
            // WRITE
            if (allWriteMethods && allWriteMethods.length) {
                for await (const currentWriteMethod of allWriteMethods) {
                    writeOutput = [...writeOutput, await currentWriteMethod(current10KResults)];
                }
            }

            OUT_OUT = [...OUT_OUT, ...current10KResults];
        }
        
    }

    console.log('writeOutputwriteOutputwriteOutputwriteOutputwriteOutputwriteOutputwriteOutputwriteOutput: ', writeOutput);
    return OUT_OUT;

    // return {
    //     OUT_OUT: OUT_OUT,
    //     allResultsArray,
    //     latency: {
    //         latencyNumbers,
    //         latencyPercentage
    //     },
    //     writeStreamToFileOutput
    // }
}

async function iterateOverAllPagesAndGetResult(
    messagesWithEqualTimestampMAP,
    loopParams,
    searchParams, 
    pageParams, 
    gatherParams,
    gatherResultsMethod,
) {
    // Iterate over ALL PAGES - step of 'pageStep'
    console.log(`--- Iterate over all pages ---`, pageParams, pageParams.pagesCount);
    let allCurrentTimestampsMAP = structuredClone(messagesWithEqualTimestampMAP);
    let resultsGatheredFrom10K = [];
    const realPagesCount = pageParams.pagesCount;

    if (!realPagesCount) {
        console.log(`Nothing to iterate! Page count is ${ realPagesCount }.`);
        console.log(`No results for messages with refference ID: ${ searchParams.referenceId }`);
        throw new Error(`Nothing to iterate! Page count is ${ realPagesCount }.`);
    }

    const pageStep = pageParams.pageStep;
    const totalNumberOfPages = pageStep === 1 ? realPagesCount : realPagesCount + pageStep;
    let latestStartPeriod;

    for (let p = 1; p <= totalNumberOfPages; p += pageStep) {
        // First page is always 1, last page is always 'totalNumberOfPages', and all other pages depend on pageStep
        // e.g.: If pageStep is  set to 4, pages: 1, 4, 8, 12, ... , 24 ,25
        let currentPage = pageStep !== 1 ? p - 1 : p;
        currentPage = currentPage === 0 ? 1 : currentPage;
        currentPage = currentPage > realPagesCount ? realPagesCount : currentPage;
        console.log('Current page number: ', currentPage);

        // TODO: move to a separate method
        const updatedSearchUrl = searchParams.getRequestURL().replace(`page=${ loopParams.initialCurrentPage }`, `page=${ currentPage }`);

        // GET CURRENT PAGE
        const currentResult = await pactum.spec()
            .use('Send COMMON GET request and return response', {
                requestURL: updatedSearchUrl,
                token: config.globals.TOKEN,
                name: 'MSG Search (Ger Current Page)'
            });
        
        
        // CURRENT PAGE RESULTS
        const currentPageResult =  currentResult.body; // All results for this page
        const currentItems = currentPageResult.items; // Array of all items
        const currentItemsLength = currentItems.length; // All items array length
        const totalPagesCount = parseInt(currentPageResult.pages); // Total number of pages
        const currentPageNumber = currentPageResult.currentPage; // Current page number

        console.log(`
            --- currentPageResult ---: 
            results: ${currentPageResult.results},
            resultsPerPage: ${currentPageResult.resultsPerPage},
            pages: ${totalPagesCount},
            currentPage: ${currentPageNumber}
            ===============================================
        `);

        if (!currentItemsLength) {
            console.log(`No results for messages with refference ID: ${ searchParams.referenceId }. 'Items' array is empty.`);
            throw new Error(`No results for messages with refference ID: ${ searchParams.referenceId }. 'Items' array is empty.`);
        }

        // ITERATE over ALL ITEMS
        let itemsCount = 0;
        let latestItem;
        
        for await (const currentItem of currentItems) {
            // SKIP
            if (allCurrentTimestampsMAP.has(currentItem.messageId)) {
                console.log(`SKIP (due to messages with equal timestamp from previous page): ${ currentItem.messageId } --- ${ currentItem.summary.queued }`);
                latestItem = currentItem;
                itemsCount++;
                continue;
            }

            // Calls the callback function - 'gatherResultsMethod' (passed as argument) with 'currentItem' as argument
            const currentresult = await gatherResultsMethod(currentItem, gatherParams); // 'accepted', 'sent'
            
            if (currentresult && ((Array.isArray(currentresult) && currentresult.length) || Object.keys(currentresult).length)) {
                // console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: ', currentItem.messageId, currentresult);
                
                const currentResultWithId = {
                    messageId: currentItem.messageId ?? '',
                    result: currentresult
                };
                resultsGatheredFrom10K = [...resultsGatheredFrom10K, currentResultWithId];

            }

            latestItem = currentItem;
            itemsCount++;
        }

        // CUSTOM FIX (move to another method)
        if (currentPage === realPagesCount) {
            allCurrentTimestampsMAP = structuredClone(getAllMessagesWithEqualTimestamp(currentItems));
        }

        // UPDATE START PERIOD
        if (itemsCount === currentItemsLength && currentPage === realPagesCount) {
            latestStartPeriod = convertToISOTimestamp(latestItem.summary.queued);
            console.log('LAST currentItem Queued time: ', latestStartPeriod);
        }
    }

    if (searchParams.startPeriod === latestStartPeriod) return;

    return {
        resultsGatheredFrom10K: resultsGatheredFrom10K,
        currentTimestampsMAP: allCurrentTimestampsMAP,
        latestStartPeriod: latestStartPeriod
    }
}

// SERVICE (of MAIN) METHODS HERE:
function getAllMessagesWithEqualTimestamp(currentItems) {
    // console.log('...... getAllMessagesWithEqualTimestamp() ......');

    const currentItemsLength = currentItems.length;
    const currentMessagesWithEqualTimestamp = new Map();
    const lastQueuedTimeStamp = currentItems[currentItemsLength - 1].summary.queued;
    
    let it = currentItemsLength - 1;
    while(lastQueuedTimeStamp === currentItems[it].summary.queued) {
        if (currentMessagesWithEqualTimestamp.has(currentItems[it].messageId)) {
            console.log(`DUPLICATED MESSAGE ID FOUND: ${ currentItems[it].messageId }`); // TODO (this could be)
        } else {
            currentMessagesWithEqualTimestamp.set(currentItems[it].messageId, currentItems[it].summary.queued);
        }
        it--;
    }

    return currentMessagesWithEqualTimestamp;
}

function convertToISOTimestamp(timeStampToFormat) {
    // console.log('...... convertToISOTimestamp() ......');

    if (!timeStampToFormat) {
        console.log(`No timestamp to format: ${ timeStampToFormat }.`);
        throw new Error(`No timestamp to format: ${ timeStampToFormat }.`);
    }
    
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

function replaceElementInArray(
    entryArray, 
    outputArrayLength, 
    pivotSymbol, 
    symbolToReplaceWith
) {
    // console.log('...... replaceElementInArray() ......');
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

// GATHER METHODS HERE:
// DUPLICATED EVENTS
function findDupicatedEvents(currentItem) {
    if (!currentItem) return;
    const events = currentItem.events;

    if (events === undefined || events === null || !events.length || !Array.isArray(events)) return;

    const eventTypes = events.map(event => {
        return event.type;
    });

    const eventTypesSet = new Set(eventTypes);
    
    return eventTypes.filter(type => {
        if(eventTypesSet.has(type)) {
            eventTypesSet.delete(type);
        } else {
            return type;
        }
    });
}

// MISSING EVENTS
function findMissingEvents(currentItem, expectedEventsArray) {
    if (!currentItem) return;
    const events = currentItem.events;

    if (events === undefined || events === null || !events.length || !Array.isArray(events)) return;

    const eventTypes = events.map(event => {
        return event.type;
    });

    const eventTypesSet = new Set(eventTypes);

    return [...expectedEventsArray].filter((event) => {
        if (!eventTypesSet.has(event)) {
            return event;
        }
    });
}

// EVENT LATENCY
function returnEventLatency(currentItem, eventParams) {
    const startEvent = eventParams.startEvent ?? 'accepted';
    const endEvent = eventParams.endEvent ?? 'sent';
    
    if (!currentItem) return;

    const events = currentItem.events;
    if (events === undefined || events === null || !events.length || !Array.isArray(events)) {
        return;
    }

    // TODO: refactor .find()
    const foundStartEvent = events.find(event => {
        return event.type === startEvent;
    });
    const foundEndEvent = events.find(event => {
        return event.type === endEvent;
    });
    
    // TODO: allMissingEventIDs and allMissingEventTimestampIDs are not defined
    if (foundStartEvent == undefined || foundEndEvent == undefined) {
        // allMissingEventIDs.push(currentItem.messageId);
        throw new Error(`Cannot find start (${ startEvent } - ${ foundStartEvent }) OR end (${ endEvent } - ${ foundEndEvent }) event!`);
        // return;
    }

    if (foundStartEvent.timeStamp == undefined || foundEndEvent.timeStamp == undefined) {
        // allMissingEventTimestampIDs.push(currentItem.messageId);
        throw new Error(`Cannot find start (${ startEvent } - ${ foundStartEvent.timeStamp }) OR end (${ endEvent } - ${ foundEndEvent.timeStamp }) event timestamp!`);
        // return;
    }

    const messageLatency = calculateTimeDifference(foundStartEvent.timeStamp, foundEndEvent.timeStamp)
    
    return {
        name: `${ startEvent } to ${ endEvent }`,
        startTimeStamp: `${ foundStartEvent.timeStamp }`,
        endTimeStamp: `${ foundEndEvent.timeStamp }`,
        latency: messageLatency
    }
}

function calculateTimeDifference(fromTime, toTime) {
    const startTime = new Date(fromTime);
    const endTime = new Date(toTime);
    const differenceTravel = endTime.getTime() - startTime.getTime();

    return differenceTravel / 1000;
}

// WRITE METHODS HERE:
// ARRAY
function makeWriteResultToArray() {
    console.log('...... makeWriteResultsArr() ......');
    let outputResArr = [];

    return function (itemToWrite) {
        console.log(',,,,,, makeWriteResultsArr() - return function ,,,,,,');
        // TODO: add check for itemToWrite --> otherwise return undefined or throw error.
        outputResArr = [...outputResArr, ...itemToWrite];
        // console.log('<-------------------------------------------------------------outputResArr', outputResArr);
        return outputResArr;
    }
}

// STREAM
async function makeWriteResultToStream(URL) {
    console.log('...... makeWriteResultToStream() ......', URL);

    return async function (itemsToWrite) {
        console.log(',,,,,, makeWriteResultToStream() - return function ,,,,,,');
        // // TODO: add check for itemToWrite --> otherwise return undefined or throw error
        
        // Open stream
        const writeStream = initStreamEvents(URL); // '././output/duplicated-events/all_duplicated_events.csv'
        
        // Actual write
        for await (const item of itemsToWrite) {
            await writeStreamToFile(formatResult(item), writeStream);
        }

        // Close the stream
        await closeStream(writeStream);

        // TODO: think of a way to make it pure function
        return `Successfully wrote ${ itemsToWrite.length } items in ${ URL } ! First message ID: ${ itemsToWrite[0].messageId } - last message ID: ${ itemsToWrite[itemsToWrite.length - 1].messageId }`;
    }
}

async function makeWriteLatencyStats() {
    console.log('...... makeWriteLatencyStats() ......');
    let allStats = {
        latencyStatistics: {
            latenciesBelowOne: 0,
            latenciesBetweenOneAndTwo: 0,
            latenciesBetweenTwoAndFour: 0,
            latenciesOverFour: 0,
            total: 0
        },
        latencyPercentages: {}
    };

    return function(latencyResults) {
        let latencyStatistics = allStats.latencyStatistics;

        for (const latencyResult of latencyResults) {
            if (latencyResult.result.latency < 1) {
                latencyStatistics.latenciesBelowOne++;
            } else if (latencyResult.result.latency >= 1 && latencyResult.result.latency < 2) {
                latencyStatistics.latenciesBetweenOneAndTwo++;
            } else if (latencyResult.result.latency >= 2 && latencyResult.result.latency < 4) {
                latencyStatistics.latenciesBetweenTwoAndFour++;
            } else if (latencyResult.result.latency >= 4) {
                latencyStatistics.latenciesOverFour++;
            }
            latencyStatistics.total++;
        }
        allStats.latencyPercentages = calculatePercentage(latencyStatistics);
        return allStats;
    }
}

function calculatePercentage(latencyStatistics) {
    console.log('Calculating percentages ...');
    let latencyPercentages = {};
    const total = latencyStatistics.total;

    if(!total) return `Total number of records is ${ total }! Cannot calculate percentage.`;

    for (const property in latencyStatistics) {
        latencyPercentages[property] = `${ roundNumber((latencyStatistics[property] / total) * 100) }%`;
    }

    delete latencyPercentages.total;
    return latencyPercentages;
}

function roundNumber(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}


// FORMAT RESULT
function formatResult(result) {
    if (!result) return;
    let formattedResult;

    if (typeof result === 'string') {
        formattedResult = result;
    } else {
        formattedResult = concatenateIntoString('', result);
    }

    return formattedResult;
}

function concatenateIntoString(acc, obj) {
    let formattedResult = acc;
    
    for (let property in obj) {
        if(typeof obj[property] === 'object' && !Array.isArray(obj[property])) {
            formattedResult = concatenateIntoString(formattedResult, obj[property]);
        } else {
            formattedResult += `${ obj[property] }; `;
        }
    }

    return formattedResult;
}

// STREAM
function initStreamEvents(outputFileDir) {
    console.log('++++++ initStreamEvents ++++++', outputFileDir);
    
    const writeStream = fs.createWriteStream(outputFileDir, {
        flags: 'a'
    });
    if (!writeStream) return;

    const pathName = writeStream.path;
    // the finish event is emitted when all data has been flushed from the stream
    writeStream.on('finish', () => {
        console.log(`Write Strem on FINISH: Wrote all data to file ${pathName}.`);
    });

    // handle the errors on the write process
    writeStream.on('error', (err) => {
        console.error(`Write Strem on ERROR: There is an error writing the file ${pathName} => ${err}!`)
    });

    return writeStream;
}

async function writeStreamToFile(item, writeStream) {
    // console.log('++++++ writeStreamToFile ++++++', item, writeStream.path);
    writeStream.write(`${ item }\r\n`);
}

async function closeStream(stream) {
    console.log('++++++ closeStream ++++++', stream.path);
    stream.end();
    await finished(stream);
}

// HELPER METHODS HERE: (TODO: import them from another file)
function deepCloneObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;

    const newObject = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        const value = obj[key];
        newObject[key] = deepCloneObject(value);
    }

    return newObject;
};

export default getAllMessageSearchResults;

export {
    findDupicatedEvents,
    findMissingEvents,
    returnEventLatency,
    makeWriteResultToArray,
    makeWriteResultToStream,
    makeWriteLatencyStats
};
