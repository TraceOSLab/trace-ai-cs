/**
 * 配置文件
 */

/** 火山引擎文档链接 */
export const Disclaimer = 'https://www.volcengine.com/docs/6348/68916';
export const ReversoContext = 'https://www.volcengine.com/docs/6348/68918';
export const UserAgreement = 'https://www.volcengine.com/docs/6348/128955';

/**
 * API Proxy Server 地址
 * 对应后端 FastAPI 服务地址
 */
export const AIGC_PROXY_HOST = 'http://localhost:3001';

export interface IScene {
  icon: string;
  name: string;
  questions: string[];
  agentConfig: Record<string, any>;
  llmConfig: Record<string, any>;
  asrConfig: Record<string, any>;
  ttsConfig: Record<string, any>;
}
