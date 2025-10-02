#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkBedrockAgentcoreStack } from '../lib/cdk-bedrock-agentcore-stack';
import { actualParameters } from '../parameters';

const app = new cdk.App();

new CdkBedrockAgentcoreStack(app, 'CdkBedrockAgentcoreStack', {
  parameters: actualParameters,
});