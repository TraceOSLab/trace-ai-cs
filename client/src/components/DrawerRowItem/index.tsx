import React, { useState } from 'react';
import { Drawer, DrawerProps } from '@arco-design/web-react';
import { IconRight } from '@arco-design/web-react/icon';
import styles from './index.module.less';

type IDrawerRowItemProps = {
  btnSrc?: string;
  btnText: string;
  suffix?: React.ReactNode;
  drawer?: {
    title: string;
    width?: string | number;
    onOpen?: () => void;
    onClose?: () => void;
    onCancel?: () => void;
    children?: React.ReactNode;
    footer?: React.ReactNode | boolean;
  } & DrawerProps;
} & React.HTMLAttributes<HTMLDivElement>;

function DrawerRowItem(props: IDrawerRowItemProps) {
  const { btnSrc, btnText, suffix, drawer, style: divStyle, className = '' } = props;
  const [open, setOpen] = useState(false);
  const { onClose, onOpen } = drawer || {};

  const handleClose = () => {
    drawer?.onCancel?.();
    setOpen(false);
    onClose?.();
  };

  const handleOpen = () => {
    setOpen(true);
    onOpen?.();
  };

  return (
    <>
      <div style={divStyle || {}} className={`${styles.row} ${className}`} onClick={handleOpen}>
        <div className={styles.firstPart}>
          {btnSrc ? <img src={btnSrc} className={styles.icon} alt="svg" /> : null}
          {btnText}
          {suffix}
        </div>
        <div className={styles.finalPart}>
          <IconRight className={styles.rightOutlined} />
        </div>
      </div>
      <Drawer
        closable
        title={drawer?.title || ''}
        width={drawer?.width || 400}
        className={styles.drawer}
        visible={open}
        onCancel={handleClose}
        footer={null}
      >
        <div className={styles.children}>{drawer?.children}</div>
      </Drawer>
    </>
  );
}

export default DrawerRowItem;
