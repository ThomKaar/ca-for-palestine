'use client';
import './styles/page.css';
import { useEffect, useState } from 'react';
import Form from './components/Form';


const env = process.env.NODE_ENV || 'development';

export default function Home() {
   const [countSchiff, setCountSchiff] = useState<number | 0>(0);
   const [countPadilla, setCountPadilla] = useState<number | 0>(0);

   useEffect(() => {
    fetch('/api/count-emails?rep=Schiff,Padilla')
      .then(res => res.json())
      .then(data => {
        const { Schiff = 0, Padilla = 0 } = data.counts;
        setCountSchiff(Schiff);
        setCountPadilla(Padilla);
      })
      .catch(err => console.error(err));
  }, []);


  return (
     <main>
      <Form env={env} counts={{ schiff: countSchiff, padilla: countPadilla }}/>
    </main>
  );
};
