import type { PackDomain } from '@rosco/shared';
import { loadPacks, savePacks } from './store.js';

export interface PackRepository<T extends { id: string; createdAt: number }> {
  list(): T[];
  get(id: string): T | undefined;
  add(pack: T): void;
}

/** Repositorio en memoria respaldado en disco: se carga una vez al arrancar el servidor y cada
 * cambio se persiste de inmediato, así los paquetes sobreviven a un reinicio de la aplicación. */
export function createPackRepository<T extends { id: string; createdAt: number }>(
  domain: PackDomain,
): PackRepository<T> {
  let packs: T[] = loadPacks<T>(domain);

  return {
    list(): T[] {
      return packs;
    },
    get(id: string): T | undefined {
      return packs.find((p) => p.id === id);
    },
    add(pack: T): void {
      packs = [pack, ...packs];
      savePacks(domain, packs);
    },
  };
}
