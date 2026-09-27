'use client';
import './styles/page.css';
import Form from './components/Form';

const env = process.env.NODE_ENV || 'development';

export default function Home() {
  return (
    <main>
      <Form env={env} />
    </main>
  );
};
