import { io, Socket } from "socket.io-client";

const SOCKET_URL = "https://realtime-polling-system-731v.onrender.com";

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});