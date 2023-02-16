const AWS = require('aws-sdk');
const sqs = new AWS.SQS();
const models = require('@vector-remote-care/mysql-orm');

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
    const realEvent = JSON.parse(event.Records[0].body);
    await sleep(2000);
    let clinic = await models.Clinic.findOne({
        where: {
            id: 1
        }
    });
    console.log(clinic);
    if (realEvent.i == 5) {
        throw Error('Stuck');
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}