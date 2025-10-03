#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkBedrockAgentcoreStack } from '../lib/cdk-bedrock-agentcore-stack';
import { actualParameters } from '../parameters';

const app = new cdk.App();

// runtimeNameをStack名に含めることで、複数のRuntimeを独立してデプロイ可能にする
const stackName = `CdkBedrockAgentcore-${actualParameters.runtimeName}-Stack`;

new CdkBedrockAgentcoreStack(app, stackName, {
  parameters: actualParameters,
});