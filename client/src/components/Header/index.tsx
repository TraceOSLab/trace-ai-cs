import { Button, Divider, Popover } from '@arco-design/web-react';
import { IconMenu } from '@arco-design/web-react/icon';
import NetworkIndicator from '@/components/NetworkIndicator';
import { useIsMobile } from '@/utils/utils';
import { Disclaimer, ReversoContext, UserAgreement } from '@/config';
import styles from './index.module.less';

function Header() {
  const isMobile = useIsMobile();

  const MenuProps = [
    { name: '免责声明', url: Disclaimer },
    { name: '隐私政策', url: ReversoContext },
    { name: '用户协议', url: UserAgreement },
  ];

  return (
    <div className={styles.header}>
      <div className={styles['header-logo']}>
        {!isMobile && (
          <Popover
            content={
              <div className={styles['menu-wrapper']}>
                {MenuProps.map((menuItem) => (
                  <Button
                    type="text"
                    key={menuItem.name}
                    onClick={() => window.open(menuItem.url, '_blank')}
                  >
                    {menuItem.name}
                  </Button>
                ))}
              </div>
            }
          >
            <IconMenu className={styles['header-setting-btn']} />
          </Popover>
        )}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="url(#logo-grad)" />
          <path d="M14 6c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" fill="#fff"/>
          <path d="M12 12h4v4h-4z" fill="#1664ff"/>
          <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
              <stop offset="0%" stopColor="#004fff"/>
              <stop offset="100%" stopColor="#9865ff"/>
            </linearGradient>
          </defs>
        </svg>
        <Divider type="vertical" />
        <span className={styles['header-logo-text']}>Trace AI - 实时对话式 AI</span>
        <NetworkIndicator />
      </div>
      {!isMobile && (
        <div className={styles['header-right']}>
          <div
            className={styles['header-right-text']}
            onClick={() =>
              window.open('https://www.volcengine.com/product/veRTC/ConversationalAI', '_blank')
            }
          >
            官网链接
          </div>
          <div
            className={styles['header-right-text']}
            onClick={() =>
              window.open('https://www.volcengine.com/contact/product?t=%E5%AF%B9%E8%AF%9D%E5%BC%8Fai', '_blank')
            }
          >
            联系我们
          </div>
        </div>
      )}
    </div>
  );
}

export default Header;
