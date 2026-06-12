/**
 * Redux Store 配置
 */

import { configureStore } from '@reduxjs/toolkit';
import roomSlice, { RoomState } from './slices/room';
import deviceSlice, { DeviceState } from './slices/device';

export interface RootState {
  room: RoomState;
  device: DeviceState;
}

const store = configureStore({
  reducer: {
    room: roomSlice,
    device: deviceSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
