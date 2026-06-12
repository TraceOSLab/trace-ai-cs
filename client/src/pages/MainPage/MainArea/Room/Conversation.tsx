import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Spin } from '@arco-design/web-react';
import { RootState } from '@/store';
import Loading from '@/components/Loading/HorizonLoading';
import { isMobile } from '@/utils/utils';
import { useScene } from '@/lib/useCommon';
import styles from './index.module.less';

function Conversation(props: React.HTMLAttributes<HTMLDivElement> & { showSubtitle: boolean }) {
  const { className, showSubtitle, ...rest } = props;
  const room = useSelector((state: RootState) => state.room);
  const { msgHistory, isFullScreen } = room;
  const { userId } = useSelector((state: RootState) => state.room.localUser);
  const { isAITalking, isUserTalking, scene } = useSelector((state: RootState) => state.room);
  const isAIReady = msgHistory.length > 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const { botName, icon, isAvatarScene } = useScene();

  const isUserTextLoading = (owner: string) => {
    return owner === userId && isUserTalking;
  };

  const isAITextLoading = (owner: string) => {
    return (owner === botName || owner.includes('voiceChat_')) && isAITalking;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight - container.clientHeight;
    }
  }, [msgHistory.length]);

  return (
    <div
      ref={containerRef}
      className={`${styles.conversation} ${className || ''} ${isFullScreen ? styles.fullScreen : ''} ${
        isMobile() ? styles.mobileConversation : ''
      }`}
      style={isAvatarScene && !isAIReady ? { justifyContent: 'center' } : {}}
      {...rest}
    >
      {!isAIReady ? (
        <div className={styles.aiReadying}>
          <Spin size={16} className={styles['aiReading-spin']} />
          AI 准备中, 请稍侯
        </div>
      ) : null}
      {(showSubtitle ? msgHistory : []).map(({ value, user, isInterrupted }, index) => {
        const isUserMsg = user === userId;
        const isRobotMsg = user === botName || user.includes('voiceChat_');
        if (!isUserMsg && !isRobotMsg) return null;

        return (
          <div
            key={`msg-container-${index}`}
            className={styles.mobileLine}
            style={{ justifyContent: isUserMsg && isMobile() ? 'flex-end' : '' }}
          >
            {!isMobile() && (
              <div className={styles.msgName}>
                <div className={styles.avatar}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="12" fill={isUserMsg ? '#f1f3f5' : '#e5f2ff'} />
                    <circle cx="12" cy="9" r="4" fill={isUserMsg ? '#86909c' : '#635bff'} />
                    <ellipse cx="12" cy="20" rx="8" ry="4" fill={isUserMsg ? '#86909c' : '#635bff'} />
                  </svg>
                </div>
                {isUserMsg ? '我' : scene}
              </div>
            )}
            <div
              className={`${styles.sentence} ${isUserMsg ? styles.user : styles.robot}`}
              key={`msg-${index}`}
            >
              <div className={styles.content}>
                {value}
                <div className={styles['loading-wrapper']}>
                  {isAIReady &&
                  (isUserTextLoading(user) || isAITextLoading(user)) &&
                  index === msgHistory.length - 1 ? (
                    <Loading gap={3} className={styles.loading} />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Conversation;
