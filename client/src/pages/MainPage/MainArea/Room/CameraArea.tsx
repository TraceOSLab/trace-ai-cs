import { useSelector } from 'react-redux';
import { VideoRenderMode } from '@volcengine/rtc';
import { useEffect } from 'react';
import { RootState } from '@/store';
import { useDeviceState, useScene } from '@/lib/useCommon';
import RtcClient from '@/lib/RtcClient';

import UserTag from '@/components/UserTag';
import LocalPlayerSet from '@/components/LocalPlayerSet';
import AiAvatarCard from '@/components/AiAvatarCard';
import { LocalFullID, RemoteFullID } from '@/components/FullScreenCard';

const LocalVideoID = 'local-video-player';
const LocalScreenID = 'local-screen-player';
const RemoteVideoID = 'remote-video-player';

const cameraWrapperStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 264,
  borderRadius: 8,
  background: '#eaedf1',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  border: '0.81px solid #dde2e9',
  zIndex: 4,
  overflow: 'hidden',
};

const playerStyle: React.CSSProperties = {
  width: '100%',
  height: 184,
  borderRadius: 8,
  overflow: 'hidden',
};

const placeholderStyle: React.CSSProperties = {
  width: '100%',
  height: 184,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: 12,
  color: '#737a87',
  textAlign: 'center',
};

function CameraArea(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  const room = useSelector((state: RootState) => state.room);
  const { isFullScreen, scene } = room;
  const { isVision, isScreenMode, botName } = useScene();
  const { isVideoPublished, isScreenPublished, switchCamera, switchScreenCapture } = useDeviceState();
  const isRemoteVideoPublished =
    room.remoteUsers.find((user) => user.username === botName)?.publishVideo ?? false;

  const setVideoPlayer = () => {
    RtcClient.removeLocalVideoPlayer(room.localUser.username!);
    if (isVideoPublished || isScreenPublished) {
      RtcClient.setLocalVideoPlayer(
        room.localUser.username!,
        isFullScreen ? LocalFullID : isScreenMode ? LocalScreenID : LocalVideoID,
        isScreenPublished,
        isScreenMode ? VideoRenderMode.RENDER_MODE_FILL : VideoRenderMode.RENDER_MODE_HIDDEN
      );
      if (isRemoteVideoPublished) {
        RtcClient.setRemoteVideoPlayer(botName, isFullScreen ? RemoteVideoID : RemoteFullID);
      }
    }
  };

  useEffect(() => {
    setVideoPlayer();
  }, [isVideoPublished, isScreenPublished, isScreenMode, isFullScreen, isVision]);

  const showCamera = isVideoPublished && !isScreenMode;
  const showScreen = isScreenPublished && isScreenMode;
  const showPlaceholder = !isVideoPublished && !isScreenPublished;

  return (
    <div className={className || ''} style={cameraWrapperStyle} {...rest}>
      <UserTag name={isFullScreen ? scene : '我'} />
      {isFullScreen ? (
        <AiAvatarCard showUserTag={false} showStatus />
      ) : null}
      {showCamera || showScreen ? <LocalPlayerSet /> : null}
      <div
        id={LocalVideoID}
        style={{ ...playerStyle, display: showCamera ? 'block' : 'none' }}
      />
      <div
        id={LocalScreenID}
        style={{ ...playerStyle, display: showScreen ? 'block' : 'none' }}
      />
      <div
        id={RemoteVideoID}
        style={{
          ...playerStyle,
          display: isFullScreen && isRemoteVideoPublished ? 'block' : 'none',
          position: 'absolute',
        }}
      />
      {showPlaceholder && (
        <div style={placeholderStyle}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="30" fill="#f1f3f5" />
            <path d="M30 15c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm12 22h-4v-2c0-2.2-1.8-4-4-4h-8c-2.2 0-4 1.8-4 4v2H18c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h24c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2z" fill="#c7ccd6" />
          </svg>
          {isScreenMode && !isFullScreen && (
            <div>
              打开
              <span onClick={() => switchScreenCapture(true)} style={{ color: '#1664ff', cursor: 'pointer', marginLeft: 2 }}>
                屏幕共享
              </span>
              <div>体验豆包视觉理解模型</div>
            </div>
          )}
          {isVision && !isScreenMode && !isFullScreen && (
            <div>
              打开
              <span onClick={() => switchCamera(true)} style={{ color: '#1664ff', cursor: 'pointer', marginLeft: 2 }}>
                摄像头
              </span>
              <div>体验豆包视觉理解模型</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CameraArea;
