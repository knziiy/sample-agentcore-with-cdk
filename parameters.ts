/**
 * この設定ファイルで各種パラメータを設定してください。
 * Bedrock AgentCore IdentityとGatewayは別途コンソールで手動作成が必要です。
 */
export interface ProjectParameters {
  
  runtimeName: string;
  
  applicationDirectory: string;
  
  agentCoreGatewaySettings?: {
    GATEWAY_URL?: string;
    COGNITO_SCOPE?: string;
    IDENTITY_PROVIDER_NAME?: string;
    SECRET_ARN?: string;
  };
  
  useKnowledgeBase?: boolean;
  
  toolsSystemPrompt?: string;
  
  postgresqlConfig?: {
    clusterArn: string;
    secretArn: string;
  };
}

export const actualParameters: ProjectParameters = {
  runtimeName: 'MyAgentRuntime',
  applicationDirectory: './lib/app',
  
  // 以下は必要に応じて利用部分のみコメントアウトを解除して利用

//   // AgentCore Gateway設定（必要に応じて設定）
//   agentCoreGatewaySettings: {
//     GATEWAY_URL: "https://your-gateway-name.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp",
//     COGNITO_SCOPE: "your-gateway-name/genesis-gateway:invoke",
//     IDENTITY_PROVIDER_NAME: "agentcore-identity-for-gateway",
//     SECRET_ARN: "arn:aws:secretsmanager:us-east-1:YOUR-ACCOUNT-ID:secret:bedrock-agentcore-identity!default/oauth2/agentcore-identity-for-gateway-XXXXXX"
//   },
  
//   // Knowledge Base の利用（使用する場合のみ設定）
//   // 具体的なタグの設定などはmcp.jsonにて指定
//   useKnowledgeBase: true,

//   // ツール用システムプロンプト（カスタマイズする場合のみ設定）
//   toolsSystemPrompt: `
// 以下のツール群を適切に利用して回答すること。
// ツールのリストは毎回取得すること。

// 利用可能なツール情報:
//  - PostgreSQL用のMCPサーバ: 社員に関する情報が格納されたDBにアクセス可能なツール。
//  - Bedrockナレッジベース用のMCPサーバ: 会社のナレッジベースにアクセス可能なツール。
//    - ナレッジベース名="your-knowledge-base": 会社の情報を保持するナレッジベース
//  `,

//   // PostgreSQL設定（使用する場合のみ設定）
//   postgresqlConfig: {
//     clusterArn: "arn:aws:rds:us-east-1:YOUR-ACCOUNT-ID:cluster:your-aurora-cluster",
//     secretArn: "arn:aws:secretsmanager:us-east-1:YOUR-ACCOUNT-ID:secret:your-db-secret-name-XXXXXX",
//   }

};