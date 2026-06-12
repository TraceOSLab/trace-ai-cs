import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Popover } from '@arco-design/web-react';
import { RootState } from '@/store';
import { updateFullScreen } from '@/store/slices/room';
import styles from './index.module.less';

function LocalPlayerSet() {
  const dispatch = useDispatch();
  const room = useSelector((state: RootState) => state.room);
  const { isFullScreen } = room;
  const [loading, setLoading] = useState(false);
  const [isFull, setFull] = useState(isFullScreen);

  const setLocalPlayer = () => {
    setLoading(true);
    setFull(!isFull);
    dispatch(updateFullScreen({ isFullScreen: !isFull }));
    setLoading(false);
  };

  return (
    <div
      onClick={setLocalPlayer}
      className={styles.container}
      style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
    >
      <Popover content="切换屏幕">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 3H3C1.9 3 1 3.9 1 5V17C1 18.1 1.9 19 3 19H21C22.1 19 23 18.1 23 17V5C23 3.9 22.1 3 21 3ZM21 17H3V5H21V17Z" fill="#4e5969"/>
          <path d="M9 21H15V19H9V21Z" fill="#4e5969"/>
        </svg>
      </Popover>
    </div>
  );
}

export default LocalPlayerSet;
