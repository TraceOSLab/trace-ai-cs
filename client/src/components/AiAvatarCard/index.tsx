import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import UserTag from '../UserTag';
import { useDeviceState, useScene } from '@/lib/useCommon';
import style from './index.module.less';

interface IAiAvatarCardProps {
  showStatus: boolean;
  showUserTag: boolean;
  className?: string;
}

const THRESHOLD_VOLUME = 18;

function AiAvatarCard(props: IAiAvatarCardProps) {
  const { showStatus, showUserTag, className } = props;
  const room = useSelector((state: RootState) => state.room);
  const { icon } = useScene();
  const { scene, isAITalking, isFullScreen } = room;
  const volume = room.localUser.audioPropertiesInfo?.linearVolume || 0;
  const { isAudioPublished } = useDeviceState();
  const isLoading = volume >= THRESHOLD_VOLUME && isAudioPublished;

  return (
    <div className={`${style.card} ${className || ''} ${isFullScreen ? style.fullScreen : ''}`}>
      <div className={style.avatar}>
        <img id="avatar-card" src={icon || 'https://lf3-rtc-demo.volccdn.com/obj/rtc-aigc-assets/DoubaoAvatar.png'} alt="Avatar" />
        {showStatus ? (
          isAITalking ? (
            <div className={style.aiStatus}>
              <div className={style.barContainer}>
                <div className={style.bar} />
                <div className={style.bar} />
                <div className={style.bar} />
              </div>
            </div>
          ) : isLoading ? (
            <div className={style.aiStatus}>正在听...</div>
          ) : null
        ) : null}
      </div>
      {showUserTag ? <UserTag name={scene} /> : null}
    </div>
  );
}

export default AiAvatarCard;
