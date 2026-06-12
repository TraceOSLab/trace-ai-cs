/**
 * RTC 核心客户端
 * 基于 @volcengine/rtc SDK
 */

import VERTC, {
  MirrorType,
  StreamIndex,
  IRTCEngine,
  RoomProfileType,
  MediaType,
  LocalStreamStats,
  RemoteStreamStats,
  StreamRemoveReason,
  LocalAudioPropertiesInfo,
  RemoteAudioPropertiesInfo,
  AudioProfileType,
  DeviceInfo,
  AutoPlayFailedEvent,
  PlayerEvent,
  NetworkQuality,
  VideoRenderMode,
  ScreenEncoderConfig,
} from '@volcengine/rtc';
import { Message } from '@arco-design/web-react';
import Apis from '@/app/index';
import RTCAIAnsExtension from '@volcengine/rtc/extension-ainr';
import { string2tlv } from '@/utils/utils';
import { COMMAND, INTERRUPT_PRIORITY } from '@/utils/handler';

export interface IEventListener {
  handleError: (e: { errorCode: any }) => void;
  handleUserJoin: (e: any) => void;
  handleUserLeave: (e: any) => void;
  handleTrackEnded: (e: { kind: string; isScreen: boolean }) => void;
  handleUserPublishStream: (e: { userId: string; mediaType: MediaType }) => void;
  handleUserUnpublishStream: (e: { userId: string; mediaType: MediaType; reason: StreamRemoveReason }) => void;
  handleRemoteStreamStats: (e: RemoteStreamStats) => void;
  handleLocalStreamStats: (e: LocalStreamStats) => void;
  handleLocalAudioPropertiesReport: (e: LocalAudioPropertiesInfo[]) => void;
  handleRemoteAudioPropertiesReport: (e: RemoteAudioPropertiesInfo[]) => void;
  handleAudioDeviceStateChanged: (e: DeviceInfo) => void;
  handleAutoPlayFail: (e: AutoPlayFailedEvent) => void;
  handlePlayerEvent: (e: PlayerEvent) => void;
  handleRoomBinaryMessageReceived: (e: { userId: string; message: ArrayBuffer }) => void;
  handleNetworkQuality: (uplinkNetworkQuality: NetworkQuality, downlinkNetworkQuality: NetworkQuality) => void;
}

export interface BasicBody {
  app_id: string;
  room_id: string;
  user_id: string;
  token?: string;
}

export class RTCClient {
  engine!: IRTCEngine;
  basicInfo!: BasicBody;
  private _audioCaptureDevice?: string;
  private _videoCaptureDevice?: string;
  audioBotEnabled = false;
  audioBotStartTime = 0;

  createEngine = async () => {
    this.engine = VERTC.createEngine(this.basicInfo.app_id);
    try {
      const AIAnsExtension = new RTCAIAnsExtension();
      await this.engine.registerExtension(AIAnsExtension);
      AIAnsExtension.enable();
    } catch (error) {
      console.warn(
        `当前环境不支持 AI 降噪, 此错误可忽略, 不影响实际使用, e: ${(error as any).message}`
      );
    }
  };

  addEventListeners = (listeners: IEventListener) => {
    this.engine.on(VERTC.events.onError, listeners.handleError);
    this.engine.on(VERTC.events.onUserJoined, listeners.handleUserJoin);
    this.engine.on(VERTC.events.onUserLeave, listeners.handleUserLeave);
    this.engine.on(VERTC.events.onTrackEnded, listeners.handleTrackEnded);
    this.engine.on(VERTC.events.onUserPublishStream, listeners.handleUserPublishStream);
    this.engine.on(VERTC.events.onUserUnpublishStream, listeners.handleUserUnpublishStream);
    this.engine.on(VERTC.events.onRemoteStreamStats, listeners.handleRemoteStreamStats);
    this.engine.on(VERTC.events.onLocalStreamStats, listeners.handleLocalStreamStats);
    this.engine.on(VERTC.events.onAudioDeviceStateChanged, listeners.handleAudioDeviceStateChanged);
    this.engine.on(VERTC.events.onLocalAudioPropertiesReport, listeners.handleLocalAudioPropertiesReport);
    this.engine.on(VERTC.events.onRemoteAudioPropertiesReport, listeners.handleRemoteAudioPropertiesReport);
    this.engine.on(VERTC.events.onAutoplayFailed, listeners.handleAutoPlayFail);
    this.engine.on(VERTC.events.onPlayerEvent, listeners.handlePlayerEvent);
    this.engine.on(VERTC.events.onRoomBinaryMessageReceived, listeners.handleRoomBinaryMessageReceived);
    this.engine.on(VERTC.events.onNetworkQuality, listeners.handleNetworkQuality);
  };

  joinRoom = () => {
    console.log('------ userJoinRoom\n', `roomId: ${this.basicInfo.room_id}\n`, `uid: ${this.basicInfo.user_id}`);
    return this.engine.joinRoom(
      this.basicInfo.token!,
      `${this.basicInfo.room_id!}`,
      {
        userId: this.basicInfo.user_id!,
        extraInfo: JSON.stringify({
          call_scene: 'RTC-AIGC',
          user_name: this.basicInfo.user_id,
          user_id: this.basicInfo.user_id,
        }),
      },
      {
        isAutoPublish: true,
        isAutoSubscribeAudio: true,
        roomProfileType: RoomProfileType.chat,
      }
    );
  };

  leaveRoom = () => {
    this.audioBotEnabled = false;
    this.engine.leaveRoom().catch(() => {});
    VERTC.destroyEngine(this.engine);
    this._audioCaptureDevice = undefined;
  };

  checkPermission(): Promise<{ video: boolean; audio: boolean }> {
    return VERTC.enableDevices({ video: false, audio: true });
  }

  async getDevices(props?: { video?: boolean; audio?: boolean }) {
    const { video = false, audio = true } = props || {};
    let audioInputs: MediaDeviceInfo[] = [];
    let audioOutputs: MediaDeviceInfo[] = [];
    let videoInputs: MediaDeviceInfo[] = [];
    const { video: hasVideoPermission, audio: hasAudioPermission } = await VERTC.enableDevices({ video, audio });

    if (audio) {
      const inputs = await VERTC.enumerateAudioCaptureDevices();
      const outputs = await VERTC.enumerateAudioPlaybackDevices();
      audioInputs = inputs.filter((i) => i.deviceId && i.kind === 'audioinput');
      audioOutputs = outputs.filter((i) => i.deviceId && i.kind === 'audiooutput');
      this._audioCaptureDevice = audioInputs.filter((i) => i.deviceId)?.[0]?.deviceId;
      if (hasAudioPermission) {
        if (!audioInputs?.length) {
          Message.error('无麦克风设备, 请先确认设备情况。');
        }
        if (!audioOutputs?.length) {
          Message.error('无扬声器设备, 请先确认设备情况。');
        }
      } else {
        Message.error('暂无麦克风设备权限, 请先确认设备权限授予情况。');
      }
    }
    if (video) {
      videoInputs = await VERTC.enumerateVideoCaptureDevices();
      videoInputs = videoInputs.filter((i) => i.deviceId && i.kind === 'videoinput');
      this._videoCaptureDevice = videoInputs?.[0]?.deviceId;
      if (hasVideoPermission) {
        if (!videoInputs?.length) {
          Message.error('无摄像头设备, 请先确认设备情况。');
        }
      } else {
        Message.error('暂无摄像头设备权限, 请先确认设备权限授予情况。');
      }
    }

    return { audioInputs, audioOutputs, videoInputs };
  }

  startVideoCapture = async (camera?: string) => {
    await this.engine.startVideoCapture(camera || this._videoCaptureDevice);
  };

  stopVideoCapture = async () => {
    this.engine.setLocalVideoMirrorType(MirrorType.MIRROR_TYPE_RENDER);
    await this.engine.stopVideoCapture();
  };

  startScreenCapture = async (enableAudio = false) => {
    await this.engine.startScreenCapture({ enableAudio });
  };

  stopScreenCapture = async () => {
    await this.engine.stopScreenCapture();
  };

  startAudioCapture = async (mic?: string) => {
    await this.engine.startAudioCapture(mic || this._audioCaptureDevice);
  };

  stopAudioCapture = async () => {
    await this.engine.stopAudioCapture();
  };

  publishStream = (mediaType: MediaType) => {
    this.engine.publishStream(mediaType);
  };

  unpublishStream = (mediaType: MediaType) => {
    this.engine.unpublishStream(mediaType);
  };

  publishScreenStream = async (mediaType: MediaType) => {
    await this.engine.publishScreen(mediaType);
  };

  unpublishScreenStream = async (mediaType: MediaType) => {
    await this.engine.unpublishScreen(mediaType);
  };

  setScreenEncoderConfig = async (description: ScreenEncoderConfig) => {
    await this.engine.setScreenEncoderConfig(description);
  };

  setBusinessId = (businessId: string) => {
    this.engine.setBusinessId(businessId);
  };

  setAudioVolume = (volume: number) => {
    this.engine.setCaptureVolume(StreamIndex.STREAM_INDEX_MAIN, volume);
    this.engine.setCaptureVolume(StreamIndex.STREAM_INDEX_SCREEN, volume);
  };

  setAudioProfile = (profile: AudioProfileType) => {
    this.engine.setAudioProfile(profile);
  };

  switchDevice = (deviceType: MediaType, deviceId: string) => {
    if (deviceType === MediaType.AUDIO) {
      this._audioCaptureDevice = deviceId;
      this.engine.setAudioCaptureDevice(deviceId);
    }
    if (deviceType === MediaType.VIDEO) {
      this._videoCaptureDevice = deviceId;
      this.engine.setVideoCaptureDevice(deviceId);
    }
    if (deviceType === MediaType.AUDIO_AND_VIDEO) {
      this._audioCaptureDevice = deviceId;
      this._videoCaptureDevice = deviceId;
      this.engine.setVideoCaptureDevice(deviceId);
      this.engine.setAudioCaptureDevice(deviceId);
    }
  };

  setLocalVideoMirrorType = (type: MirrorType) => {
    return this.engine.setLocalVideoMirrorType(type);
  };

  setLocalVideoPlayer = (
    userId: string,
    renderDom?: string | HTMLElement,
    isScreenShare = false,
    renderMode = VideoRenderMode.RENDER_MODE_FILL
  ) => {
    return this.engine.setLocalVideoPlayer(
      isScreenShare ? StreamIndex.STREAM_INDEX_SCREEN : StreamIndex.STREAM_INDEX_MAIN,
      { renderDom, userId, renderMode }
    );
  };

  setRemoteVideoPlayer = (userId: string, renderDom?: string | HTMLElement, renderMode = VideoRenderMode.RENDER_MODE_HIDDEN) => {
    return this.engine.setRemoteVideoPlayer(
      StreamIndex.STREAM_INDEX_MAIN,
      { renderDom, userId, renderMode }
    );
  };

  removeLocalVideoPlayer = (userId: string, scope: StreamIndex | 'Both' = 'Both') => {
    let removeScreen = scope === StreamIndex.STREAM_INDEX_SCREEN;
    let removeCamera = scope === StreamIndex.STREAM_INDEX_MAIN;
    if (scope === 'Both') {
      removeCamera = true;
      removeScreen = true;
    }
    if (removeScreen) {
      this.engine.setLocalVideoPlayer(StreamIndex.STREAM_INDEX_SCREEN, { userId });
    }
    if (removeCamera) {
      this.engine.setLocalVideoPlayer(StreamIndex.STREAM_INDEX_MAIN, { userId });
    }
  };

  startAgent = async (scene: string) => {
    if (this.audioBotEnabled) {
      await this.stopAgent(scene);
    }
    await Apis.VoiceChat.StartVoiceChat({ SceneID: scene });
    this.audioBotEnabled = true;
    this.audioBotStartTime = Date.now();
  };

  stopAgent = async (scene: string) => {
    if (this.audioBotEnabled || sessionStorage.getItem('audioBotEnabled')) {
      await Apis.VoiceChat.StopVoiceChat({ SceneID: scene });
      this.audioBotStartTime = 0;
      sessionStorage.removeItem('audioBotEnabled');
    }
    this.audioBotEnabled = false;
  };

  commandAgent = ({
    command,
    agentName,
    interruptMode = INTERRUPT_PRIORITY.NONE,
    message = '',
  }: {
    command: COMMAND;
    agentName: string;
    interruptMode?: INTERRUPT_PRIORITY;
    message?: string;
  }) => {
    if (this.audioBotEnabled) {
      this.engine.sendUserBinaryMessage(
        agentName,
        string2tlv(
          JSON.stringify({
            Command: command,
            InterruptMode: interruptMode,
            Message: message,
          }),
          'ctrl'
        )
      );
    } else {
      console.warn('Interrupt failed, bot not enabled.');
    }
  };

  updateAgent = async (scene: string) => {
    if (this.audioBotEnabled) {
      await this.stopAgent(scene);
      await this.startAgent(scene);
    } else {
      await this.startAgent(scene);
    }
  };

  getAgentEnabled = () => {
    return this.audioBotEnabled;
  };
}

export default new RTCClient();
