import { useState } from 'react';
import { useDeviceState, useLeave, useScene } from '@/lib/useCommon';
import SettingsDrawer from '../SettingsDrawer';
import styles from './index.module.less';

function MobileToolBar() {
  const [open, setOpen] = useState(false);
  const { isVision, isScreenMode } = useScene();
  const leaveRoom = useLeave();
  const { isAudioPublished, isVideoPublished, switchMic, switchCamera } = useDeviceState();

  return (
    <div className={styles.toolbar}>
      <div className={styles.btn} onClick={() => switchMic(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          {isAudioPublished ? (
            <path d="M12 14c2.21 0 4-1.79 4-4V6c0-2.21-1.79-4-4-4S8 3.79 8 6v4c0 2.21 1.79 4 4 4zm-2-8c0-1.1.9-2 2-2s2 .9 2 2v4c0 1.1-.9 2-2 2s-2-.9-2-2V6zm6 4c0 3.31-2.69 6-6 6s-6-2.69-6-6H3c0 4.08 3.06 7.44 7 7.93V21h2v-3.07c3.94-.49 7-3.85 7-7.93h-3z" fill="#fff"/>
          ) : (
            <path d="M12 14c2.21 0 4-1.79 4-4V6c0-2.21-1.79-4-4-4S8 3.79 8 6v4c0 2.21 1.79 4 4 4zm-2-8c0-1.1.9-2 2-2s2 .9 2 2v4c0 1.1-.9 2-2 2s-2-.9-2-2V6zm10.3 4.5c0 5.1-4.14 9.26-9.3 9.26S1.7 15.6 1.7 10.5H0c0 6.06 4.89 10.98 11 11.5V24h2v-2c6.11-.52 11-5.44 11-11.5h-1.7z" fill="#ff4d4f"/>
          )}
        </svg>
      </div>
      {isVision && !isScreenMode && (
        <div className={styles.btn} onClick={() => switchCamera(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill={isVideoPublished ? '#fff' : '#ff4d4f'}/>
          </svg>
        </div>
      )}
      <div className={styles.btn} onClick={leaveRoom}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-8v-2h8v2z" fill="#ff4d4f"/>
        </svg>
      </div>
      <div className={styles.btn} onClick={() => setOpen(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81a.48.48 0 00-.47-.41h-3.84a.48.48 0 00-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="#fff"/>
        </svg>
      </div>
      <SettingsDrawer visible={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export default MobileToolBar;
