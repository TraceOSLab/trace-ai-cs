/**
 * 消息处理模块 - RTC 二进制消息解析处理
 */

import { useDispatch } from 'react-redux';
import logger from './logger';
import {
  setHistoryMsg,
  setInterruptMsg,
  updateAITalkState,
  updateAIThinkState,
} from '@/store/slices/room';
import RtcClient from '@/lib/RtcClient';
import { string2tlv, tlv2String } from '@/utils/utils';

export type AnyRecord = Record<string, any>;

export enum MESSAGE_TYPE {
  BRIEF = 'conv',
  SUBTITLE = 'subv',
  FUNCTION_CALL = 'tool',
}

export enum AGENT_BRIEF {
  UNKNOWN,
  LISTENING,
  THINKING,
  SPEAKING,
  INTERRUPTED,
  FINISHED,
}

/**
 * 指令类型
 */
export enum COMMAND {
  INTERRUPT = 'interrupt',
  EXTERNAL_TEXT_TO_SPEECH = 'ExternalTextToSpeech',
  EXTERNAL_TEXT_TO_LLM = 'ExternalTextToLLM',
}

/**
 * 打断优先级
 */
export enum INTERRUPT_PRIORITY {
  NONE,
  HIGH,
  MEDIUM,
  LOW,
}

export const MessageTypeCode = {
  [MESSAGE_TYPE.SUBTITLE]: 1,
  [MESSAGE_TYPE.FUNCTION_CALL]: 2,
  [MESSAGE_TYPE.BRIEF]: 3,
};

export const useMessageHandler = () => {
  const dispatch = useDispatch();

  const maps = {
    /**
     * 接收状态变化信息
     */
    [MESSAGE_TYPE.BRIEF]: (parsed: AnyRecord) => {
      const { Stage } = parsed || {};
      const { Code, Description } = Stage || {};
      logger.debug('[MESSAGE_TYPE.BRIEF]: ', Code, Description);
      switch (Code) {
        case AGENT_BRIEF.THINKING:
          dispatch(updateAIThinkState({ isAIThinking: true }));
          break;
        case AGENT_BRIEF.SPEAKING:
          dispatch(updateAITalkState({ isAITalking: true }));
          break;
        case AGENT_BRIEF.FINISHED:
          dispatch(updateAITalkState({ isAITalking: false }));
          break;
        case AGENT_BRIEF.INTERRUPTED:
          dispatch(setInterruptMsg());
          break;
        default:
          break;
      }
    },
    /**
     * 字幕处理
     */
    [MESSAGE_TYPE.SUBTITLE]: (parsed: AnyRecord) => {
      const data = parsed.data?.[0] || {};
      if (data) {
        const { text: msg, definite, userId: user, paragraph } = data;
        const isAudioEnable = RtcClient.getAgentEnabled();
        if ((window as any)._debug_mode) {
          logger.debug('handleRoomBinaryMessageReceived', data);
        }
        if (isAudioEnable) {
          dispatch(setHistoryMsg({ text: msg, user, paragraph, definite }));
        }
      }
    },
    /**
     * Function calling
     */
    [MESSAGE_TYPE.FUNCTION_CALL]: (parsed: AnyRecord) => {
      const name: string = parsed?.tool_calls?.[0]?.function?.name;
      console.log('[Function Call] - Called by sendUserBinaryMessage');
      const map: Record<string, string> = {
        getcurrentweather: '今天下雪， 最低气温零下10度',
      };

      RtcClient.engine.sendUserBinaryMessage(
        'RobotMan_',
        string2tlv(
          JSON.stringify({
            ToolCallID: parsed?.tool_calls?.[0]?.id,
            Content: map[name.toLocaleLowerCase().replaceAll('_', '')],
          }),
          'func'
        )
      );
    },
  };

  return {
    parser: (buffer: ArrayBuffer) => {
      try {
        const { type, value } = tlv2String(buffer);
        maps[type as MESSAGE_TYPE]?.(JSON.parse(value));
      } catch (e) {
        logger.debug('parse error', e);
      }
    },
  };
};
