import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PackDomain } from '@rosco/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/dist/packs/store.js -> server/data/ (fuera de dist, no se borra al recompilar)
const DATA_DIR = path.join(__dirname, '../../data');

function filePath(domain: PackDomain): string {
  return path.join(DATA_DIR, `${domain}-packs.json`);
}

/** Lee los paquetes guardados de un dominio. Si el archivo no existe todavía, empieza vacío. */
export function loadPacks<T>(domain: PackDomain): T[] {
  try {
    const raw = fs.readFileSync(filePath(domain), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Escribe la lista completa de paquetes de un dominio, sobrescribiendo el archivo anterior. */
export function savePacks<T>(domain: PackDomain, packs: T[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath(domain), JSON.stringify(packs, null, 2), 'utf-8');
}
