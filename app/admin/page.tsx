import { Metadata } from 'next';
import AdminClient from './AdminClient';

export const metadata: Metadata = {
  title: 'Admin — Cemrosta',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
