/**
 * API 接口定义
 */

export const BasicAPIs = [
  { action: 'getScenes', apiPath: '/getScenes', method: 'post' },
] as const;

export const AigcAPIs = [
  { action: 'StartVoiceChat', apiPath: '/proxy', method: 'post' },
  { action: 'StopVoiceChat', apiPath: '/proxy', method: 'post' },
] as const;
