import * as cdk from 'aws-cdk-lib';
import * as agentcore from 'aws-cdk-lib/aws-bedrockagentcore';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';
import { AgentCoreRole } from './constructs/agent-core-role';
import { ProjectParameters } from '../parameters';

export interface CdkBedrockAgentcoreStackProps extends cdk.StackProps {
  parameters: ProjectParameters;
}

export class CdkBedrockAgentcoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkBedrockAgentcoreStackProps) {
    super(scope, id, props);

    const { parameters } = props;

    const dockerImageAsset = new DockerImageAsset(this, 'DockerImageAsset', {
      directory: parameters.applicationDirectory,
      platform: Platform.LINUX_ARM64, // AgentCore RuntimeはARMのみ対応
      file: 'Dockerfile',
    });

    const agentCoreRole = new AgentCoreRole(this, 'AgentCoreRole', parameters);

    const environmentVariables = {
      ...(parameters.agentCoreGatewaySettings || {}),
      TOOLS_SYSTEM_PROMPT: parameters.toolsSystemPrompt || "",
    };

    const runtime = new agentcore.CfnRuntime(this, 'AgentCoreRuntime', {
      agentRuntimeName: parameters.runtimeName,
      agentRuntimeArtifact: {
        containerConfiguration: {
          containerUri: dockerImageAsset.imageUri,
        }
      },
      networkConfiguration: {
        networkMode: 'PUBLIC',
      },
      roleArn: agentCoreRole.role.roleArn,
      protocolConfiguration: 'HTTP',
      environmentVariables: environmentVariables,
    });

    runtime.node.addDependency(agentCoreRole);

    new cdk.CfnOutput(this, 'RuntimeArn', {
      value: runtime.attrAgentRuntimeArn,
      description: 'AgentCore Runtime ARN',
    });

    new cdk.CfnOutput(this, 'RuntimeId', {
      value: runtime.attrAgentRuntimeId,
      description: 'AgentCore Runtime ID',
    });

    new cdk.CfnOutput(this, 'RuntimeVersion', {
      value: runtime.attrAgentRuntimeVersion,
      description: 'AgentCore Runtime Version',
    });
  }
}