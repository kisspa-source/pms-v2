'use client';

import { useEffect } from 'react';

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('Socket provider initialized (simulation mode)');
  }, []);

  return <>{children}</>;
}