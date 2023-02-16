const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

module.exports.send = async () => {
    // send 10 elements
    const promises = [];
    for (var i = 0; i < 15; i++) {
        const params = {
            MessageBody: JSON.stringify({
                i
            }),
            QueueUrl: process.env.QUEUE_URL
        };
        promises.push(sqs.sendMessage(params).promise());
    }
    await Promise.all(promises);
}

module.exports.main = async event => {
    console.log(event);
}