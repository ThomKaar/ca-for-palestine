'use client';
import './styles/page.css';
import { useEffect, useState } from 'react';
import Form from './components/Form';


const env = process.env.NODE_ENV || 'development';

export default function Home() {
   const [count, setCount] = useState<number | null>(null);

   useEffect(() => {
    fetch('/api/count-emails?rep=Schiff')
      .then(res => res.json())
      .then(data => setCount(data.count))
      .catch(err => console.error(err));
  }, []);

  return (
     <main>
      <Form env={env} count={count as number}/>
    </main>
  );
};
