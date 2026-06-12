import VERTC from '@volcengine/rtc';
import { Tooltip, Typography } from '@arco-design/web-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Operation from './components/Operation';
import CameraArea from '../MainArea/Room/CameraArea';
import { isMobile } from '@/utils/utils';
import { useScene } from '@/lib/useCommon';
import styles from './index.module.less';

function Menu() {
  const room = useSelector((state: RootState) => state.room);
  const isJoined = room?.isJoined;
  const { isVision, name } = useScene();
  const requestId = sessionStorage.getItem('RequestID');

  return (
    <div className={styles.wrapper}>
      {isJoined && isMobile() && isVision ? (
        <div className={styles['mobile-camera-wrapper']}>
          <CameraArea className={styles['mobile-camera']} />
        </div>
      ) : null}
      <div className={`${styles.box} ${styles.info}`}>
        <div className={styles.title}>AI 人设：{name || '自定义助手'}</div>
      </div>
      {isJoined ? <Operation /> : null}
      <div className={`${styles.box} ${styles.info}`}>
        <div className={styles.title}>{isJoined ? '其他信息' : '版本信息'}</div>
        <div className={styles.desc}>Demo Version 1.0.0</div>
        <div className={styles.desc}>SDK Version {VERTC.getSdkVersion()}</div>
        {isJoined ? (
          <div className={styles.desc}>
            房间ID{' '}
            <Tooltip content={room.roomId || '-'}>
              <Typography.Paragraph ellipsis={{ rows: 1, expandable: false }} className={styles.value}>
                {room.roomId || '-'}
              </Typography.Paragraph>
            </Tooltip>
          </div>
        ) : null}
        {room.isAIGCEnable ? (
          <div className={styles.desc}>
            RequestID{' '}
            <Tooltip content={requestId || '-'}>
              <Typography.Paragraph ellipsis={{ rows: 1, expandable: false }} className={styles.value}>
                {requestId || '-'}
              </Typography.Paragraph>
            </Tooltip>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Menu;
