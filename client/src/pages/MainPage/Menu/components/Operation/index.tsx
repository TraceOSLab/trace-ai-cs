import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import DeviceDrawerButton from '../DeviceDrawerButton';
import Subtitle from '../Subtitle';
import styles from './index.module.less';

function Operation() {
  const room = useSelector((state: RootState) => state.room);
  const isJoined = room?.isJoined;

  if (!isJoined) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>操作</div>
      <Subtitle />
      <DeviceDrawerButton />
    </div>
  );
}

export default Operation;
