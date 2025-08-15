import './styles/page.css';
import { Suspense } from 'react';
import Form from './components/Form';

let env = process.env.NODE_ENV || 'development';
const PRODUCTION = 'production';

type SearchParams = { [key:string]: string | string[] | undefined };

function DecorateEnv({ searchParams }: SearchParams) {
  const paramValue = searchParams?.env;
  if (paramValue === PRODUCTION && env === 'development') {
    env = PRODUCTION;
  }
  return '';
}
const baseUrl = process.env.BASE_URL || "http://localhost:3000";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
   const data = await fetch(`${baseUrl}/api/count-emails?rep=Schiff`);
   const { count } = await data.json();
   const params: SearchParams = await searchParams;

  return (
     <main>
      <Suspense>
        <DecorateEnv searchParams={params} />
      </Suspense>
      <Form env={env} count={count as number}/>
    </main>
  );
};
