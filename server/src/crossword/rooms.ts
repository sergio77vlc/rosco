import { customAlphabet } from 'nanoid';
import type { ServerCrosswordRoom } from './roomTypes.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusiones
const generateCode = customAlphabet(CODE_ALPHABET, 5);

const rooms = new Map<string, ServerCrosswordRoom>();

export function createCrosswordRoomCode(): string {
  let code = generateCode();
  while (rooms.has(code)) {
    code = generateCode();
  }
  return code;
}

export function saveCrosswordRoom(room: ServerCrosswordRoom): void {
  rooms.set(room.code, room);
}

export function getCrosswordRoom(code: string): ServerCrosswordRoom | undefined {
  return rooms.get(code.toUpperCase());
}

export function deleteCrosswordRoom(code: string): void {
  const room = rooms.get(code);
  if (room?.hostDisconnectTimeout) clearTimeout(room.hostDisconnectTimeout);
  rooms.delete(code);
}

export function findCrosswordRoomByPlayerSocket(socketId: string): ServerCrosswordRoom | undefined {
  for (const room of rooms.values()) {
    for (const player of room.players.values()) {
      if (player.socketId === socketId) return room;
    }
  }
  return undefined;
}

export function findCrosswordRoomByHostSocket(socketId: string): ServerCrosswordRoom | undefined {
  for (const room of rooms.values()) {
    if (room.hostSocketId === socketId) return room;
  }
  return undefined;
}
