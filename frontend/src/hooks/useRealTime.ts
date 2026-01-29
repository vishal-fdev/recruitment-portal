import { useEffect, useState } from 'react';
import api from '../api/api';

export function useRealtime<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api.get(url).then((res) => {
      if (active) {
        setData(res.data);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [url]);

  return { data, loading };
}
