
export type PromptCacheField = 'messages' | 'system' | 'tools';
export type PromptCachingConfig = {
  autoCacheFields: {
    [key in PromptCacheField]?: boolean;
  };
};

// Prompt caching
// https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html
export const SUPPORTED_CACHE_FIELDS: Record<string, PromptCacheField[]> = {
  'anthropic.claude-opus-4-5-20251101-v1:0': ['messages', 'system', 'tools'],
  'anthropic.claude-sonnet-4-5-20250929-v1:0': ['messages', 'system', 'tools'],
  'anthropic.claude-haiku-4-5-20251001-v1:0': ['messages', 'system', 'tools'],
  'anthropic.claude-opus-4-1-20250805-v1:0': ['messages', 'system', 'tools'],
  'anthropic.claude-opus-4-20250514-v1:0': ['messages', 'system', 'tools'],
  'anthropic.claude-sonnet-4-20250514-v1:0': ['messages', 'system', 'tools'],
  'anthropic.claude-3-7-sonnet-20250219-v1:0': ['messages', 'system', 'tools'],
  'anthropic.claude-3-5-haiku-20241022-v1:0': ['messages', 'system', 'tools'],
  'amazon.nova-premier-v1:0': ['messages', 'system'],
  'amazon.nova-pro-v1:0': ['messages', 'system'],
  'amazon.nova-lite-v1:0': ['messages', 'system'],
  'amazon.nova-micro-v1:0': ['messages', 'system'],
  'amazon.nova-2-lite-v1:0': ['messages', 'system'],
};

