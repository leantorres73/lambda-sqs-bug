#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { DeploymentStack } = require('../cdk/stack');

const app = new cdk.App();

const createStack = () =>
    new DeploymentStack(app, `TestDeploymentStack`, {});

createStack();
