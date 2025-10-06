import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let userSocket: Socket | null = null;

export function getAdminSocket(): Socket {
  if (socket) return socket;
  const adminToken = localStorage.getItem('adminToken');
  socket = io('http://localhost:5000', {
    transports: ['websocket'],
    auth: { adminToken }
  });
  return socket;
}

export function disconnectAdminSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getUserSocket(): Socket {
  if (userSocket) return userSocket;
  const token = localStorage.getItem('token');
  userSocket = io('http://localhost:5000', {
    transports: ['websocket'],
    auth: { token }
  });
  return userSocket;
}

export function disconnectUserSocket() {
  if (userSocket) {
    userSocket.disconnect();
    userSocket = null;
  }
}


