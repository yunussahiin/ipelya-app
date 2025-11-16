import { create } from "zustand";

type LiveRoom = {
  id: string;
  creatorId: string;
  title: string;
  livekitToken?: string;
};

type LiveState = {
  activeRoom: LiveRoom | null;
  rooms: LiveRoom[];
  setRooms: (items: LiveRoom[]) => void;
  joinRoom: (room: LiveRoom) => void;
  leaveRoom: () => void;
};

export const useLiveStore = create<LiveState>((set) => ({
  activeRoom: null,
  rooms: [],
  setRooms: (items) => set({ rooms: items }),
  joinRoom: (room) => set({ activeRoom: room }),
  leaveRoom: () => set({ activeRoom: null })
}));
