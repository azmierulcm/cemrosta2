import { Metadata } from 'next';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import DemoClient from './DemoClient';

export const metadata: Metadata = {
  title: 'Demo — Cemrosta',
  description: 'See everything you unlock when you fly with Cemrosta.',
};

export default function DemoPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        <DemoClient />
      </main>
      <Footer />
    </>
  );
}
