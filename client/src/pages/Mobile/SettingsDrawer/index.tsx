import { Drawer } from '@arco-design/web-react';
import SettingsItem from '../components/SettingsItem';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { updateShowSubtitle } from '@/store/slices/room';

interface ISettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

function SettingsDrawer(props: ISettingsDrawerProps) {
  const { visible, onClose } = props;
  const dispatch = useDispatch();
  const { isShowSubtitle } = useSelector((state: RootState) => state.room);

  return (
    <Drawer
      title="设置"
      visible={visible}
      onCancel={onClose}
      placement="bottom"
      height="auto"
      footer={null}
    >
      <SettingsItem
        label="字幕"
        checked={isShowSubtitle}
        onChange={(value) => dispatch(updateShowSubtitle({ isShowSubtitle: value }))}
      />
    </Drawer>
  );
}

export default SettingsDrawer;
