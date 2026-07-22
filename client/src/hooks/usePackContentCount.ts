import { useEffect, useState } from 'react';
import type { PackDomain } from '@rosco/shared';

/** Suma el nº de roscos/preguntas guardados en todos los paquetes de un dominio, para mostrarlo en la home. */
export function usePackContentCount(domain: PackDomain): { itemCount: number; packCount: number } {
  const [itemCount, setItemCount] = useState(0);
  const [packCount, setPackCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/packs/${domain}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data.packs)) return;
        setPackCount(data.packs.length);
        setItemCount(data.packs.reduce((sum: number, p: { count: number }) => sum + p.count, 0));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [domain]);

  return { itemCount, packCount };
}
