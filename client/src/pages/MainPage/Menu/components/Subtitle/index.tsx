import { useDispatch, useSelector } from 'react-redux';
import { Switch } from '@arco-design/web-react';
import { RootState } from '@/store';
import { updateShowSubtitle } from '@/store/slices/room';
import styles from './index.module.less';

function Subtitle() {
  const dispatch = useDispatch();
  const { isShowSubtitle } = useSelector((state: RootState) => state.room);

  return (
    <div className={styles.row}>
      <div className={styles.left}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2 4C2 2.9 2.9 2 4 2H16C17.1 2 18 2.9 18 4V16C18 17.1 17.1 18 16 18H4C2.9 18 2 17.1 2 16V4ZM4 4V16H16V4H4ZM6 12H14V14H6V12ZM6 8H14V10H6V8Z" fill="#4e5969"/>
        </svg>
        <span>字幕</span>
      </div>
      <Switch
        checked={isShowSubtitle}
        onChange={(value) => dispatch(updateShowSubtitle({ isShowSubtitle: value }))}
      />
    </div>
  );
}

export default Subtitle;
