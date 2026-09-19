import type { Metadata } from 'next';
import CallScheduler from '../components/CallScheduler';

export const metadata: Metadata = {
  title: 'Schedule a call | CA for Palestine',
  description: 'Authorize an AI advocate to call California senators on your behalf.',
};

export default function CallsPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-10 sm:px-6">
      <CallScheduler />
    </main>
  );
}
