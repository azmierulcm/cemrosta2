import { Suspense } from 'react';
import SpouseViewClient from './SpouseViewClient';
import { Loader2 } from 'lucide-react';

export default function SpouseViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-1">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    }>
      <SpouseViewClient />
    </Suspense>
  );
}
