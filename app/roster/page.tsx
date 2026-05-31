import { Navbar } from '@/components/shared/Navbar';
import RosterCardWrapper from './RosterCardWrapper';

export const metadata = {
  title: 'Roster Card — Otarosta',
  description: 'Your monthly roster as a shareable Instagram Stories card.',
};

export default function RosterPage() {
  return (
    <>
      {/* Navbar hidden on mobile — no title needed, BottomNav handles navigation */}
      <div className="hidden md:block"><Navbar /></div>
      <main id="main-content" className="min-h-screen bg-surface-2">
        <div className="mx-auto max-w-2xl px-4 pt-8 md:pt-24 pb-32">
          <header className="mb-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent font-mono mb-2">
              {'// ROSTER CARD'}
            </p>
            <h1 className="text-3xl font-black tracking-tighter text-text">
              Your month in the sky
            </h1>
            <p className="mt-2 text-[14px] text-text-muted font-bold">
              A shareable 9:16 card — screenshot and post to your Stories.
            </p>
          </header>
          <RosterCardWrapper />
        </div>
      </main>
    </>
  );
}
