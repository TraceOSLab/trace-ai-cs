import { memo, useState } from 'react';
import { Drawer } from '@arco-design/web-react';
import { useDeviceState, useLeave, useScene } from '@/lib/useCommon';
import { isMobile } from '@/utils/utils';
import Menu from '../../Menu';
import style from './index.module.less';

function ToolBar(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  const [open, setOpen] = useState(false);
  const { isVision, isScreenMode } = useScene();
  const leaveRoom = useLeave();
  const {
    isAudioPublished,
    isVideoPublished,
    isScreenPublished,
    switchMic,
    switchCamera,
    switchScreenCapture,
  } = useDeviceState();

  return (
    <div className={`${className || ''} ${style.btns} ${isMobile() ? style.column : ''}`} {...rest}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" onClick={() => switchMic(true)} className={style.btn}>
        {isAudioPublished ? (
          <path d="M12 14c2.21 0 4-1.79 4-4V6c0-2.21-1.79-4-4-4S8 3.79 8 6v4c0 2.21 1.79 4 4 4zm-2-8c0-1.1.9-2 2-2s2 .9 2 2v4c0 1.1-.9 2-2 2s-2-.9-2-2V6zm6 4c0 3.31-2.69 6-6 6s-6-2.69-6-6H3c0 4.08 3.06 7.44 7 7.93V21h2v-3.07c3.94-.49 7-3.85 7-7.93h-3z" fill={isAudioPublished ? '#635bff' : '#86909c'} />
        ) : (
          <path d="M12 14c2.21 0 4-1.79 4-4V6c0-2.21-1.79-4-4-4S8 3.79 8 6v4c0 2.21 1.79 4 4 4zm-2-8c0-1.1.9-2 2-2s2 .9 2 2v4c0 1.1-.9 2-2 2s-2-.9-2-2V6zm10.3 4.5c0 5.1-4.14 9.26-9.3 9.26S1.7 15.6 1.7 10.5H0c0 6.06 4.89 10.98 11 11.5V24h2v-2c6.11-.52 11-5.44 11-11.5h-1.7z" fill="#eb0d0d" />
        )}
      </svg>

      {isVision && !isScreenMode && !isMobile() && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" onClick={() => switchCamera(true)} className={style.btn}>
          {isVideoPublished ? (
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="#635bff"/>
          ) : (
            <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" fill="#eb0d0d"/>
          )}
        </svg>
      )}

      {isScreenMode && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" onClick={() => switchScreenCapture(true)} className={style.btn}>
          <path d="M21 3H3C1.9 3 1 3.9 1 5V17C1 18.1 1.9 19 3 19H21C22.1 19 23 18.1 23 17V5C23 3.9 22.1 3 21 3ZM21 17H3V5H21V17Z" fill={isScreenPublished ? '#635bff' : '#86909c'}/>
          <path d="M9 21H15V19H9V21Z" fill={isScreenPublished ? '#635bff' : '#86909c'}/>
        </svg>
      )}

      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" onClick={leaveRoom} className={style.btn}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-8v-2h8v2z" fill="#eb0d0d" />
      </svg>

      {isMobile() && (
        <Drawer
          title="设置"
          visible={open}
          onCancel={() => setOpen(false)}
          style={{ width: 'max-content' }}
          footer={null}
        >
          <Menu />
        </Drawer>
      )}
    </div>
  );
}

export default memo(ToolBar);
