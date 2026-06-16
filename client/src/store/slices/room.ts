/**
 * Room 状态管理
 */
import { createSlice } from '@reduxjs/toolkit';
import {
  AudioPropertiesInfo,
  LocalAudioStats,
  NetworkQuality,
  RemoteAudioStats,
} from '@volcengine/rtc';
import RtcClient from '@/lib/RtcClient';

export interface IUser {
  username?: string;
  userId?: string;
  publishAudio?: boolean;
  publishVideo?: boolean;
  publishScreen?: boolean;
  audioStats?: RemoteAudioStats;
  audioPropertiesInfo?: AudioPropertiesInfo;
}

export type LocalUser = Omit<IUser, 'audioStats'> & {
  loginToken?: string;
  audioStats?: LocalAudioStats;
};

export interface Msg {
  value: string;
  time: string;
  user: string;
  paragraph?: boolean;
  definite?: boolean;
  isInterrupted?: boolean;
}

export interface SceneConfig {
  id: string;
  icon?: string;
  name?: string;
  questions?: string[];
  botName: string;
  isVision: boolean;
  isScreenMode: boolean;
  isInterruptMode: boolean;
  isAvatarScene: boolean;
  avatarBgUrl: string;
}

export interface RTCConfig {
  AppId: string;
  RoomId: string;
  UserId: string;
  Token: string;
}

export interface RoomState {
  time: number;
  roomId?: string;
  localUser: LocalUser;
  remoteUsers: IUser[];
  autoPlayFailUser: string[];
  isJoined: boolean;
  scene: string;
  sceneConfigMap: Record<string, SceneConfig>;
  rtcConfigMap: Record<string, RTCConfig>;
  isAIGCEnable: boolean;
  isAITalking: boolean;
  isAIThinking: boolean;
  isUserTalking: boolean;
  networkQuality: NetworkQuality;
  msgHistory: Msg[];
  currentConversation: {
    [user: string]: {
      msg: string;
      definite: boolean;
    };
  };
  isShowSubtitle: boolean;
  isFullScreen: boolean;
  customSceneName: string;
}

const initialState: RoomState = {
  time: -1,
  scene: '',
  sceneConfigMap: {},
  rtcConfigMap: {},
  remoteUsers: [],
  localUser: {
    publishAudio: false,
    publishVideo: false,
    publishScreen: false,
  },
  autoPlayFailUser: [],
  isJoined: false,
  isAIGCEnable: false,
  isAIThinking: false,
  isAITalking: false,
  isUserTalking: false,
  networkQuality: NetworkQuality.UNKNOWN,
  msgHistory: [],
  currentConversation: {},
  isShowSubtitle: true,
  isFullScreen: false,
  customSceneName: '',
};

export const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    localJoinRoom: (state, { payload }: { payload: { roomId: string; user: LocalUser } }) => {
      state.roomId = payload.roomId;
      state.localUser = { ...state.localUser, ...payload.user };
      state.isJoined = true;
    },
    localLeaveRoom: (state) => {
      state.roomId = undefined;
      state.time = -1;
      state.localUser = { publishAudio: false, publishVideo: false, publishScreen: false };
      state.remoteUsers = [];
      state.isJoined = false;
    },
    remoteUserJoin: (state, { payload }) => {
      state.remoteUsers.push(payload);
    },
    remoteUserLeave: (state, { payload }) => {
      const idx = state.remoteUsers.findIndex((u) => u.userId === payload.userId);
      if (idx >= 0) state.remoteUsers.splice(idx, 1);
    },
    updateScene: (state, { payload }) => {
      state.scene = payload;
    },
    updateSceneConfig: (state, { payload }) => {
      state.sceneConfigMap = payload;
    },
    updateRTCConfig: (state, { payload }) => {
      state.rtcConfigMap = payload;
      const rtc = payload[state.scene];
      if (rtc) {
        RtcClient.basicInfo = {
          app_id: rtc.AppId,
          room_id: rtc.RoomId,
          user_id: rtc.UserId,
          token: rtc.Token,
        };
      }
    },
    updateLocalUser: (state, { payload }: { payload: Partial<LocalUser> }) => {
      state.localUser = { ...state.localUser, ...(payload || {}) };
    },
    updateNetworkQuality: (state, { payload }) => {
      state.networkQuality = payload.networkQuality;
    },
    updateRemoteUser: (state, { payload }: { payload: IUser | IUser[] }) => {
      const users = Array.isArray(payload) ? payload : [payload];
      users.forEach((user) => {
        const idx = state.remoteUsers.findIndex((u) => u.userId === user.userId);
        if (idx >= 0) state.remoteUsers[idx] = { ...state.remoteUsers[idx], ...user };
      });
    },
    updateRoomTime: (state, { payload }) => {
      state.time = payload.time;
    },
    addAutoPlayFail: (state, { payload }) => {
      if (!state.autoPlayFailUser.includes(payload.userId)) {
        state.autoPlayFailUser.push(payload.userId);
      }
    },
    removeAutoPlayFail: (state, { payload }) => {
      state.autoPlayFailUser = state.autoPlayFailUser.filter((uid) => uid !== payload.userId);
    },
    clearAutoPlayFail: (state) => {
      state.autoPlayFailUser = [];
    },
    updateAIGCState: (state, { payload }) => {
      state.isAIGCEnable = payload.isAIGCEnable;
    },
    updateAITalkState: (state, { payload }) => {
      state.isAIThinking = false;
      state.isUserTalking = false;
      state.isAITalking = payload.isAITalking;
    },
    updateAIThinkState: (state, { payload }) => {
      state.isAIThinking = payload.isAIThinking;
      state.isUserTalking = false;
    },
    clearHistoryMsg: (state) => {
      state.msgHistory = [];
    },
    setHistoryMsg: (state, { payload }) => {
      const { paragraph, definite } = payload;
      const lastMsg = state.msgHistory.at(-1);
      const currentSceneConfig = state.sceneConfigMap[state.scene];
      const fromBot =
        payload.user === currentSceneConfig?.botName ||
        payload.user.includes('voiceChat_');
      const currentSubtitleMode = currentSceneConfig?.isAvatarScene ? 1 : 0;
      const lastMsgCompleted =
        !fromBot || currentSubtitleMode ? lastMsg?.paragraph : lastMsg?.definite;

      if (lastMsg) {
        if (lastMsgCompleted) {
          state.msgHistory.push({
            value: payload.text,
            time: new Date().toString(),
            user: payload.user,
            definite,
            paragraph,
          });
        } else {
          if (fromBot && currentSubtitleMode) {
            lastMsg.value += payload.text;
          } else {
            lastMsg.value = payload.text;
          }
          lastMsg.time = new Date().toString();
          lastMsg.paragraph = paragraph;
          lastMsg.definite = definite;
          lastMsg.user = payload.user;
        }
      } else {
        state.msgHistory.push({
          value: payload.text,
          time: new Date().toString(),
          user: payload.user,
          paragraph,
        });
      }
    },
    setInterruptMsg: (state) => {
      state.isAITalking = false;
      if (!state.msgHistory.length) return;
      for (let i = state.msgHistory.length - 1; i >= 0; i--) {
        const msg = state.msgHistory[i];
        if (msg.value && !msg.definite) {
          state.msgHistory[i].isInterrupted = true;
          break;
        }
      }
    },
    clearCurrentMsg: (state) => {
      state.currentConversation = {};
      state.msgHistory = [];
      state.isAITalking = false;
      state.isUserTalking = false;
    },
    updateShowSubtitle: (state, { payload }) => {
      state.isShowSubtitle = payload.isShowSubtitle;
    },
    updateFullScreen: (state, { payload }) => {
      state.isFullScreen = payload.isFullScreen;
    },
    updateCustomSceneName: (state, { payload }) => {
      state.customSceneName = payload.customSceneName;
    },
  },
});

export const {
  localJoinRoom,
  localLeaveRoom,
  remoteUserJoin,
  remoteUserLeave,
  updateRemoteUser,
  updateLocalUser,
  updateRoomTime,
  addAutoPlayFail,
  removeAutoPlayFail,
  clearAutoPlayFail,
  updateAIGCState,
  updateAITalkState,
  updateAIThinkState,
  setHistoryMsg,
  clearHistoryMsg,
  clearCurrentMsg,
  setInterruptMsg,
  updateNetworkQuality,
  updateScene,
  updateSceneConfig,
  updateRTCConfig,
  updateShowSubtitle,
  updateFullScreen,
  updateCustomSceneName,
} = roomSlice.actions;

export default roomSlice.reducer;
