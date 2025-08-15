import './styles/page.css';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Form from './components/Form';

let env = process.env.NODE_ENV || 'development';
const PRODUCTION = 'production';

function DecorateEnv() {
  const searchParams = useSearchParams();
  const paramValue = searchParams.get('env');
  if (paramValue === PRODUCTION && env === 'development') {
    env = PRODUCTION;
  }
  return '';
}

export default async function Home() {
   const data = await fetch('/api/count-emails?rep=Schiff');
   const { count } = await data.json();

  return (
     <main>
      <Suspense>
        <DecorateEnv />
      </Suspense>
      <Form env={env} count={count as number}/>
    </main>
  );
};
