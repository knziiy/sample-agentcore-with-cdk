# CDK Bedrock AgentCore Project

このプロジェクトは、Amazon Bedrock AgentCore Runtime を AWS CDK で構築するサンプルです。

ローカルMCPサーバーをRuntimeに組み込んだり、Gateway/Identityを利用したツールの追加が可能なサンプルとなっています。

Strands AgentによるAIエージェントの実装は Generative AI Usecaes(GenU)の実装を参考にさせていただいています。

## プロジェクト構成

```
.
├── bin
│   └── cdk-bedrock-agentcore.ts        # CDKアプリケーションエントリーポイント
├── lib
│   ├── cdk-bedrock-agentcore-stack.ts  # メインスタック
│   ├── constructs
│   │   └── agent-core-role.ts          # IAMロール定義
│   └── app                             # Agentアプリケーション
│       ├── app.py                      # FastAPIアプリケーション
│       ├── Dockerfile                  # コンテナイメージ定義
│       ├── mcp.json                    # MCPサーバ設定
│       └── pyproject.toml              # Python依存関係
├── parameters.ts                       # 設定ファイル
├── cdk.json                           # CDK設定
├── package.json                       # Node.js依存関係
└── README.md
```

## セットアップ手順

### 1. 前提条件

- **Bedrock AgentCore IdentityとGateway**: 手動でAWSコンソールで事前作成が必要
- AWS CLI設定済み
- Node.js 18以上
- Docker

### 2. パラメータ設定

`parameters.ts` ファイルで環境に応じた設定を行います：

```typescript
export const actualParameters: ProjectParameters = {
  runtimeName: 'MyAgentRuntime',        // AgentRuntimeの名称
  applicationDirectory: './lib/app',    // AgentRuntimeにホストするアプリソース(Agent本体)
  
  // 以下は必要に応じてコメントアウトを解除して利用
  
  // Gateway/Identityを利用したツールを利用する場合に設定
  agentCoreGatewaySettings: {
    GATEWAY_URL: "https://your-gateway-name.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp",
    COGNITO_SCOPE: "your-gateway-name/genesis-gateway:invoke",
    IDENTITY_PROVIDER_NAME: "agentcore-identity-for-gateway",
    SECRET_ARN: "arn:aws:secretsmanager:us-east-1:YOUR-ACCOUNT-ID:secret:bedrock-agentcore-identity!default/oauth2/agentcore-identity-for-gateway-XXXXXX"
  },
  
  // Knowledge Base MCPの利用有無（具体的な参照設定はmcp.jsonで実施）
  useKnowledgeBase: true,
  
  // カスタムツールプロンプト
  toolsSystemPrompt: `
以下のツール群を適切に利用して回答すること。
ツールのリストは毎回取得すること。

利用可能なツール情報:
 - PostgreSQL用のMCPサーバ: 社員に関する情報が格納されたDBにアクセス可能なツール。
 - Bedrockナレッジベース用のMCPサーバ: 会社のナレッジベースにアクセス可能なツール。
   - ナレッジベース名="your-knowledge-base": 会社の情報を保持するナレッジベース
  `,
  
  // PostgreSQLのMCPを利用する場合の設定
  // PostgreSQL設定
  postgresqlConfig: {
    clusterArn: "arn:aws:rds:us-east-1:YOUR-ACCOUNT-ID:cluster:your-aurora-cluster", // 参照するAuroraClusterのARN
    secretArn: "arn:aws:secretsmanager:us-east-1:YOUR-ACCOUNT-ID:secret:your-db-secret-name-XXXXXX", // DataAPIで認証するために必要なSecretsManagerのsecretのARN
  }
};
```

### 3. デプロイ

```bash
# 依存関係のインストール
npm install

# CDKブートストラップ（初回のみ）
npx cdk bootstrap

# デプロイ
npx cdk deploy
```


### 4. クリーンアップ

```bash
npx cdk destroy
```


## MCPサーバ設定例

`lib/app/mcp.json`には基本的なtimeサーバのみが含まれています。以下のような追加MCPサーバを設定できます：

### Knowledge Baseアクセス制御

Knowledge Baseへのアクセスは、`mcp.json`の設定で制御されます。`parameters.ts`で`useKnowledgeBase: true`を設定すると、Knowledge Base関連の IAM 権限が付与されます。

実際にアクセス可能なKnowledge Baseは、以下の例のように`mcp.json`の`KB_INCLUSION_TAG_KEY`で指定したタグの値が"true"に設定されたKnowledge Baseのみが検索対象になります。

AWS コンソールでKnowledge Baseにタグを設定：
- タグキー: `KB_ALLOW_FROM_MCP`
- タグ値: `true`

### Knowledge Base Retrieval MCP

以下をそのまま `mcp.json` に追加し、検索対象としたいナレッジベースに `KB_ALLOW_FROM_MCP=true` のタグを付与してください。

```json
{
  "mcpServers": {
    "awslabs.bedrock-kb-retrieval-mcp-server": {
      "command": "uvx",
      "args": ["awslabs.bedrock-kb-retrieval-mcp-server@latest"],
      "env": {
        "AWS_REGION": "us-east-1",
        "FASTMCP_LOG_LEVEL": "ERROR",
        "KB_INCLUSION_TAG_KEY": "KB_ALLOW_FROM_MCP",
        "BEDROCK_KB_RERANKING_ENABLED": "false"
      }
    }
  }
}
```

### PostgreSQL MCP

Amazon Aurora/Aurora ServerlessでDataAPIを有効化したPostgreSQLデータベースを用意することで、PostgreSQL MCPを介したDB参照が可能となります。

```json
{
  "mcpServers": {
    "awslabs.postgres-mcp-server": {
      "command": "uvx",
      "args": [
        "awslabs.postgres-mcp-server@latest",
        "--resource_arn", "arn:aws:rds:us-east-1:YOUR-ACCOUNT-ID:cluster:your-aurora-cluster",
        "--secret_arn", "arn:aws:secretsmanager:us-east-1:YOUR-ACCOUNT-ID:secret:your-db-secret-name-XXXXXX",
        "--region", "us-east-1",
        "--database", "postgres",
        "--readonly", "True"
      ],
      "env": {
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```
