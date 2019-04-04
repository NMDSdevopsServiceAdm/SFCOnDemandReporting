import { handler } from '../../src/api/snapshotReport';
import AWS  from 'aws-sdk';
import * as SFC from '../../src/model/sfc.api';
import * as MySecrets from '../../src/aws/secrets';
import uuid from 'uuid';
import * as Slack from '../../src/common/slack';

describe('Snapshot Report', () => {

    describe('Handling errors', () => {
        process.env.LOG_LEVEL = 1;  // expecting error to be logged
        process.env.SLACK_LEVEL = 0;

        beforeAll(() => {
            jest.clearAllMocks();
        });
        afterEach(() => {
            jest.clearAllMocks();
        });

        const theEvent = {
        };
        const theContext = {
            invokedFunctionArn : 'arn:aws:lambda:eu-west-1:accountid:function:sfc-ondemand-reporting-snapshot-report'
        };
        const mockCallback = jest.fn();
    
        it.skip ('should silently handle when an exception is thrown in secrets', async () => {
        });
 
        it.skip('should silently handle when an exception is thrown in API', async () => {
        });

        it.skip('should call the handler safely, even on error in calling out to SfC API', async () => {
        });
    });    

    describe('expected responses', () => {
        process.env.LOG_LEVEL = 0;
        process.env.SLACK_LEVEL = 0;

        beforeAll(() => {
            jest.clearAllMocks();
        });
        afterEach(() => {
            jest.clearAllMocks();
        });
    
        const theEvent = {
        };
        const theContext = {
            invokedFunctionArn : 'arn:aws:lambda:eu-west-1:accountid:function:sfc-ondemand-reporting-snapshot-report'
        };
        const mockCallback = jest.fn();

        it.skip('should call the handler with success', async () => {
        });
    });

});