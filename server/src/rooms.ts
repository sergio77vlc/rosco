import { customAlphabet } from 'nanoid';
import type { ServerRoom } from './roomTypes.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusiones
const generateCode = customAlphabet(CODE_ALPHABET, 5);

const rooms = new Map<string, ServerRoom>();

export function createRoomCode(): string {
  let code = generateCode();
  while (rooms.has(code)) {
    code = generateCode();
  }
  return code;
}

export function saveRoom(room: ServerRoom): void {
  rooms.set(room.code, room);
}

export function getRoom(code: string): ServerRoom | undefined {
  return rooms.get(code.toUpperCase());
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code);
  if (room?.finishTimeout) clearTimeout(room.finishTimeout);
  if (room?.hostDisconnectTimeout) clearTimeout(room.hostDisconnectTimeout);
  rooms.delete(code);
}

export function findRoomByPlayerSocket(socketId: string): ServerRoom | undefined {
  for (const room of rooms.values()) {
    for (const player of room.players.values()) {
      if (player.socketId === socketId) return room;
    }
  }
  return undefined;
}

export function findRoomByHostSocket(socketId: string): ServerRoom | undefined {
  for (const room of rooms.values()) {
    if (room.hostSocketId === socketId) return room;
  }
  return undefined;
}
