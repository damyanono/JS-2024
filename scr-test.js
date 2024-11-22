'use strict';

// all imports here
import pactum from 'pactum';
import { expect } from 'chai';
import config from '../../config.js';
import Helpers from '../../lib/helpers.js';
import getAllMessageSearchResults, { 
    findDupicatedEvents, 
    makeWriteResultToArray, 
    makeWriteResultToStream,  
} from '../../lib/MRV-helpers.js';

const request = pactum.request;
const DUPLICATE_EVENTS_OUTPUT_FILE = '././output/duplicated-events/all_duplicated_events.csv';
let environmentData, searchURL;

describe('#1 FEATURE: Validate no DUPLICATED EVENTS are present', () => {
    before(async () => {
        environmentData = Helpers.getEnvironmentData('message_search');
        searchURL = `${ environmentData.envInUse.messageSearchUrl }/serviceAccounts/${ environmentData.channelClient.serviceAccountId }`;

        // TODO: Access toke should not be stored in global object 
        // Get access Bearer token for 'Aux' realm.
        await Helpers.getAccessToken('message_search', 'Aux');
        request.setDefaultHeaders({ 'Content-Type': 'application/json' });
    });

    describe('#1 DUPLICATED EVENTS', () => {
        it('#1.1 Validate NO duplicated events are present.', async () => {
            console.log('++++++ #1.1 Validate NO duplicated events are present. ++++++');

            // TEST VARIABLES
            const loopParams = {
                initialCurrentPage: 1, // first page
                totalNumberOfRecords: 50000, // 50000 or 239799
                messageSearchStep: 10000, // SHOULD ALWAYS BE 10K when you check results over 10K
                pageStep: 99 // validate each page with number of 'pageStep'
            };
            
            // requestURL: `${ searchParams.searchURL }/search?page=${ loopParams.initialCurrentPage }&size=${searchParams.itemsPerPage}&start=${searchParams.startPeriod}&sort=${searchParams.sortMethod}&referenceId=${searchParams.referenceId}`,
            const searchParams = {
                itemsPerPage: 100,
                startPeriod: '2024-10-10T12:33:14.756Z', // '2024-10-10T12:33:14.756Z'
                sortMethod: 'summary.queued:asc',
                referenceId: '17-10-2024-NATS-DIR-SIM-1', //TODO: should get dynamically 
                getRequestURL: function() {
                    return `${ searchURL }/search?page=${ loopParams.initialCurrentPage }&size=${ this.itemsPerPage }&start=${ this.startPeriod }&sort=${ this.sortMethod }&referenceId=${ this.referenceId }`
                }
            };

            const ALL_DUPLICATED_EVENTS = (await getAllMessageSearchResults(
                loopParams,
                searchParams,
                (currentItem) => findDupicatedEvents(currentItem),
                DUPLICATE_EVENTS_OUTPUT_FILE, 
                makeWriteResultToArray,
                makeWriteResultToStream,
            )).allResults;

            // ALL Duplicated events
            console.log('ALL Duplicated Events: ',  ALL_DUPLICATED_EVENTS);
            expect(ALL_DUPLICATED_EVENTS, `Duplicated events found: '${ ALL_DUPLICATED_EVENTS }.`).to.be.empty;
        });
    });
});
