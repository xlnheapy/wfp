'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/business-indicators');
  }, [router]);

  return null;
}
