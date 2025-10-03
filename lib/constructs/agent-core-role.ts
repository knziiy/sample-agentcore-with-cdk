import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ProjectParameters } from '../../parameters';

/**
 * Bedrock AgentCore Runtime用のIAM Roleを作成
 */
export class AgentCoreRole extends Construct {
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, params: ProjectParameters) {
    super(scope, id);

    const region = cdk.Stack.of(this).region;
    const accountId = cdk.Stack.of(this).account;

    // AgentCore Runtime用のIAMロール
    // runtimeNameを含めることで、複数のRuntimeが独立したロールを持つ
    this.role = new iam.Role(this, 'BedrockAgentCoreRole', {
      roleName: `BedrockAgentCore-${params.runtimeName}-Role`,
      assumedBy: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com'),
      description: `IAM role for Bedrock AgentCore Runtime: ${params.runtimeName}`,
    });

    // 基本権限の追加
    this.addBasicPermissions(region, accountId);
    
    // オプション設定に基づく権限の追加
    if (params.useKnowledgeBase) {
      this.addKnowledgeBasePermissions(region, accountId);
    }
    
    if (params.postgresqlConfig) {
      this.addPostgreSQLPermissions(region, accountId, params.postgresqlConfig);
    }
    
    if (params.agentCoreGatewaySettings?.GATEWAY_URL) {
      this.addAgentCoreIdentityPermissions(region, accountId, params.agentCoreGatewaySettings?.SECRET_ARN);
    }
  }

  /**
   * 基本権限の追加
   */
  private addBasicPermissions(region: string, accountId: string) {
    // ECR Image Accessの権限
    this.role.addToPolicy(new iam.PolicyStatement({
      sid: 'ECRImageAccess',
      effect: iam.Effect.ALLOW,
      actions: [
        'ecr:BatchGetImage',
        'ecr:GetDownloadUrlForLayer'
      ],
      resources: [
        `arn:aws:ecr:${region}:${accountId}:repository/*`
      ]
    }));

    // ECR Token Accessの権限
    this.role.addToPolicy(new iam.PolicyStatement({
      sid: 'ECRTokenAccess',
      effect: iam.Effect.ALLOW,
      actions: [
        'ecr:GetAuthorizationToken'
      ],
      resources: ['*']
    }));

    // CloudWatch Logsの権限
    this.role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:DescribeLogStreams',
        'logs:CreateLogGroup'
      ],
      resources: [
        `arn:aws:logs:${region}:${accountId}:log-group:/aws/bedrock-agentcore/runtimes/*`
      ]
    }));

    this.role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:DescribeLogGroups'
      ],
      resources: [
        `arn:aws:logs:${region}:${accountId}:log-group:*`
      ]
    }));

    this.role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: [
        `arn:aws:logs:${region}:${accountId}:log-group:/aws/bedrock-agentcore/runtimes/*:log-stream:*`
      ]
    }));

    // X-Rayの権限
    this.role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'xray:PutTraceSegments',
        'xray:PutTelemetryRecords',
        'xray:GetSamplingRules',
        'xray:GetSamplingTargets'
      ],
      resources: ['*']
    }));

    // CloudWatch Metricsの権限
    this.role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*'],
      conditions: {
        StringEquals: {
          'cloudwatch:namespace': 'bedrock-agentcore'
        }
      }
    }));

    // Agent Access Tokenの権限
    this.role.addToPolicy(new iam.PolicyStatement({
      sid: 'GetAgentAccessToken',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock-agentcore:GetWorkloadAccessToken',
        'bedrock-agentcore:GetWorkloadAccessTokenForJWT',
        'bedrock-agentcore:GetWorkloadAccessTokenForUserId'
      ],
      resources: [
        `arn:aws:bedrock-agentcore:${region}:${accountId}:workload-identity-directory/default`,
        `arn:aws:bedrock-agentcore:${region}:${accountId}:workload-identity-directory/default/workload-identity/*`
      ]
    }));

    // Bedrockモデル呼び出しの権限
    this.role.addToPolicy(new iam.PolicyStatement({
      sid: 'BedrockModelInvocation',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream'
      ],
      resources: [
        'arn:aws:bedrock:*::foundation-model/*',
        `arn:aws:bedrock:${region}:${accountId}:*`
      ]
    }));
  }

  /**
   * Knowledge Base権限の追加（タグベース）
   */
  private addKnowledgeBasePermissions(region: string, accountId: string) {
    // Knowledge Baseに対するデータアクセス権限
    // 理想としてはMCPサーバと同様にタグによる制限をしたいがKnowledge Baseはタグベースの制御に非対応
    // 厳密に制限したい場合は resources に列挙すること
    this.role.addToPolicy(new iam.PolicyStatement({
      sid: 'BedrockKnowledgeBaseDataAccess',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:Retrieve',
        'bedrock:RetrieveAndGenerate',
        'bedrock:GetKnowledgeBase',
      ],
      resources: [`arn:aws:bedrock:${region}:${accountId}:knowledge-base/*`]
    }));

    // Knowledge Baseのリスト系権限（全体に対する参照のみ）
    this.role.addToPolicy(new iam.PolicyStatement({
      sid: 'BedrockKnowledgeBaseListAccess',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:ListDataSources',
        'bedrock:ListKnowledgeBases',
        'bedrock:ListTagsForResource',
        'bedrock:Rerank'
      ],
      resources: ['*']
    }));
  }

  /**
   * PostgreSQL権限の追加
   */
  private addPostgreSQLPermissions(
    region: string, 
    accountId: string, 
    config: { clusterArn: string; secretArn: string }
  ) {
    // PostgreSQL MCPのためのSecrets Managerのアクセス権限
    this.role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
      ],
      resources: [
        config.secretArn
      ]
    }));

    // RDS Data APIの権限
    this.role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'rds-data:BeginTransaction',
        'rds-data:CommitTransaction',
        'rds-data:ExecuteStatement',
        'rds-data:RollbackTransaction'
      ],
      resources: [
        config.clusterArn
      ]
    }));
  }

  /**
   * AgentCore Identity権限の追加
   */
  private addAgentCoreIdentityPermissions(region: string, accountId: string, secretArn?: string) {
    // AgentCore Identity利用のための権限
    this.role.addToPolicy(new iam.PolicyStatement({
      sid: 'AgentCoreIdentityAccess',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock-agentcore:CreateWorkloadIdentity',
        'bedrock-agentcore:UpdateWorkloadIdentity',
        'bedrock-agentcore:DeleteWorkloadIdentity',
      ],
      resources: [
        cdk.Stack.of(this).formatArn({
          service: 'bedrock-agentcore',
          resource: 'workload-identity-directory',
          resourceName: `*`,
        }),
      ],
    }));

    // OAuth2 Token取得権限
    this.role.addToPolicy(new iam.PolicyStatement({
      sid: 'AgentCoreIdentityOauth2',
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock-agentcore:GetResourceOauth2Token',
      ],
      resources: [
        `arn:aws:bedrock-agentcore:${region}:${accountId}:token-vault/default/oauth2credentialprovider/*`,
        `arn:aws:bedrock-agentcore:${region}:${accountId}:token-vault/default`,
        `arn:aws:bedrock-agentcore:${region}:${accountId}:workload-identity-directory/default/workload-identity/workload-*`,
        `arn:aws:bedrock-agentcore:${region}:${accountId}:workload-identity-directory/default`,
      ],
    }));

    // IdentityのSecret取得のための権限（設定されている場合のみ）
    if (secretArn) {
      this.role.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
        ],
        resources: [
          secretArn
        ]
      }));
    }
  }
}