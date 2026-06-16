import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Header from '@/components/Header';
import ResizeWrapper from '@/components/ResizeWrapper';
import Menu from './Menu';
import { useIsMobile } from '@/utils/utils';
import Apis from '@/api/index';
import MainArea from './MainArea';
import { ABORT_VISIBILITY_CHANGE, useLeave } from '@/lib/useCommon';
import {
  RTCConfig,
  SceneConfig,
  updateRTCConfig,
  updateScene,
  updateSceneConfig,
} from '@/store/slices/room';
import styles from './index.module.less';

export default function MainPage() {
  const leaveRoom = useLeave();
  const dispatch = useDispatch();
  const isMobile = useIsMobile();

  const getScenes = async () => {
    const res: any = await Apis.Basic.getScenes();
    const scenes: any[] = res?.scenes || [];
    dispatch(updateScene(scenes[0]?.scene?.id || ''));
    dispatch(
      updateSceneConfig(
        scenes.reduce((prev: any, cur: any) => {
          prev[cur.scene.id] = cur.scene;
          return prev;
        }, {}),
      ),
    );
    dispatch(
      updateRTCConfig(
        scenes.reduce((prev: any, cur: any) => {
          prev[cur.scene.id] = cur.rtc;
          return prev;
        }, {}),
      ),
    );
  };

  useEffect(() => {
    getScenes();
    const isOriginalDemo = window.location.host.startsWith('localhost');
    const handler = () => {
      if (document.visibilityState === 'hidden' && !sessionStorage.getItem(ABORT_VISIBILITY_CHANGE)) {
        leaveRoom();
      }
    };
    !isOriginalDemo && document.addEventListener('visibilitychange', handler);
    return () => {
      !isOriginalDemo && document.removeEventListener('visibilitychange', handler);
    };
  }, []);

  return (
    <ResizeWrapper className={styles.container}>
      <Header />
      <div className={styles.main} style={{ padding: isMobile ? '' : '24px' }}>
        <div className={`${styles.mainArea} ${isMobile ? styles.isMobile : ''}`}>
          <MainArea />
        </div>
        {isMobile ? null : (
          <div className={styles.operationArea}>
            <Menu />
          </div>
        )}
      </div>
    </ResizeWrapper>
  );
}
