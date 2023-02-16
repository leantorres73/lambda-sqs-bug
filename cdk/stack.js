const core = require('aws-cdk-lib');
const sqs = require('aws-cdk-lib/aws-sqs');
const lambda = require('aws-cdk-lib/aws-lambda');

const nodeLambda = require('aws-cdk-lib/aws-lambda-nodejs');
const destinations = require('aws-cdk-lib/aws-lambda-destinations');
const eventsource = require('aws-cdk-lib/aws-lambda-event-sources');
const cdkUtils = require('@vector-remote-care/cdk-utils');

class DeploymentStack extends core.Stack {
    /**
     *
     * @param {cdk.Construct} scope
     * @param {string} id
     * @param {cdk.StackProps=} props
     */
    constructor(scope, id, props) {
        super(scope, id, props);

        const queueVisibilityTimeout = core.Duration.minutes(30);
        const dlQueue = new sqs.Queue(this, `dlqtestqueue`, {
            queueName: `test-dlq`,
            visibilityTimeout: queueVisibilityTimeout
        });

        const queue = new sqs.Queue(this, `testqueue`, {
            queueName: `test`,
            visibilityTimeout: queueVisibilityTimeout,
            deadLetterQueue: {
                queue: dlQueue,
                maxReceiveCount: 5
            }
        });
        const environments = cdkUtils.secrets.getDBEnvironments(this, props.isProd);
        const senderLambda = new nodeLambda.NodejsFunction(
            this,
            'senderLambda',
            {
                runtime: lambda.Runtime.NODEJS_14_X,
                entry: 'handler.js',
                handler: 'send',
                timeout: core.Duration.seconds(300),
                environment: {
                    ...environments,
                    QUEUE_URL: queue.queueUrl
                },
                bundling: {
                    nodeModules: [
                        '@vector-remote-care/mysql-orm',
                    ],
                    externalModules: [
                        'aws-sdk',
                        'pg-hstore',
                        '@vector-remote-care/mysql-orm'
                    ]
                }
            }
        );
        const receiverLambda = new nodeLambda.NodejsFunction(
            this,
            'receiverLambda',
            {
                runtime: lambda.Runtime.NODEJS_14_X,
                entry: 'handler.js',
                handler: 'main',
                vpc: cdkUtils.vpc.getVPC(this),
                reservedConcurrentExecutions: 1,
                environment: {
                    ...environments,
                    QUEUE_URL: queue.queueUrl
                },
                bundling: {
                    nodeModules: [
                        '@vector-remote-care/mysql-orm',
                    ],
                    externalModules: [
                        'aws-sdk',
                        'pg-hstore',
                        '@vector-remote-care/mysql-orm'
                    ]
                },
                timeout: core.Duration.seconds(300)
            }
        );

        queue.grantSendMessages(senderLambda);
        receiverLambda.addEventSource(
            new eventsource.SqsEventSource(queue, {
                batchSize: 1,
                maxConcurrency: 2
            })
        );
    }
}

module.exports = { DeploymentStack };
