/**
 * API 入口 - 导出所有 API 方法
 */

import { AigcAPIs, BasicAPIs } from './api';
import { generateAPIs } from './base';

const VoiceChat = generateAPIs(AigcAPIs);
const Basic = generateAPIs(BasicAPIs);

export default {
  VoiceChat,
  Basic,
};
