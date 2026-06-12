import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Antechamber from './Antechamber';
import Room from './Room';

function MainArea() {
  const room = useSelector((state: RootState) => state.room);
  const isJoined = room.isJoined;
  return isJoined ? <Room /> : <Antechamber />;
}

export default MainArea;
