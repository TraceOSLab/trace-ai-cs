import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { updateSelectedDevice } from '@/store/slices/device';
import DrawerRowItem from '@/components/DrawerRowItem';
import { Select } from '@arco-design/web-react';
import RtcClient, { BasicBody } from '@/lib/RtcClient';
import { MediaType } from '@volcengine/rtc';

function DeviceDrawerButton() {
  const dispatch = useDispatch();
  const { audioInputs } = useSelector((state: RootState) => state.device);
  const { selectedMicrophone } = useSelector((state: RootState) => state.device);
  const room = useSelector((state: RootState) => state.room);
  const { rtcConfigMap, scene } = room;

  const handleSwitchMic = (value: string) => {
    RtcClient.switchDevice(MediaType.AUDIO, value);
    dispatch(updateSelectedDevice({ selectedMicrophone: value }));
  };

  const drawerContent = (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>麦克风</div>
        <Select
          onChange={handleSwitchMic}
          value={selectedMicrophone}
          style={{ width: '100%' }}
          placeholder="选择麦克风"
        >
          {audioInputs.map((item) => (
            <Select.Option key={item.deviceId} value={item.deviceId}>
              {item.label || item.deviceId}
            </Select.Option>
          ))}
        </Select>
      </div>
      <div>
        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>房间配置</div>
        <div style={{ fontSize: 12, color: '#86909c', marginBottom: 4 }}>
          AppId: {rtcConfigMap[scene]?.AppId || '-'}
        </div>
        <div style={{ fontSize: 12, color: '#86909c' }}>
          RoomId: {rtcConfigMap[scene]?.RoomId || '-'}
        </div>
      </div>
    </div>
  );

  return (
    <DrawerRowItem
      btnText="设备与房间信息"
      drawer={{
        title: '设备与房间信息',
        children: drawerContent,
      }}
    />
  );
}

export default DeviceDrawerButton;
