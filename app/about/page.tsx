const SECTION_CLASSNAMES = 'flex flex-col gap-2 my-4';
const LINK_CLASSNAMES = 'text-blue-600 hover:underline';

const resources = [
    {
        text: '61,430 Palestinian people have been killed and 153,213 others injured in Israeli attacks on Gaza since 7 October 2023.',
        link: 'https://www.theguardian.com/world/live/2025/aug/10/israel-gaza-war-protests-aid-latest-news-updates?utm_source=chatgpt.com'
    },
    {
        text: 'The UN on widespread starvation in Gaza, due to U.S. blockades.',
        link: 'https://news.un.org/en/story/2025/07/1165517'
    },
    {
        text: 'Jewish Voice For Peace, an organization that is aiding in Palestinian Liberation and helps explain the wide gap between advocating for Palestinian Liberation and being antisemitic.',
        link: 'https://www.jewishvoiceforpeace.org/about/#values'
    },
    {
        text: 'Info about the journalists who have been killed by Netanyahu\'s government.',
        link: 'https://www.aljazeera.com/news/2025/8/11/here-are-the-names-of-the-journalists-israel-killed-in-gaza'
    },
    {
        text: 'A list of Senators who are voted against blocking further sales of military weapons after IIRC had recognized Israel\'s actions as warcrimes',
        link: 'https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00455.htm#state'
    },
];
export default function AboutPage() {
    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 h-full gap-10">
            <header className="flex flex-col" >
                <h2 className="font-bold text-xl">
                    About
                </h2>
            </header>
            <section className={SECTION_CLASSNAMES + ' pl-2'}>
                <br/>
                <p>
                    Hi. I&apos;ve made this website because of all of the deeply saddening things I&apos;ve seen going on in Gaza.
                </p>
                <p>
                    Thiking about all of the folks being unjustly killed as they are forced out of the homes they were born and grew up in, is depressing.
                </p>
                <p>
                    I&apos;ve been contacting Senators Schiff and Padilla since April 2025 when Senator Bernie Sanders introduced a bill to block sales of military arms and services to Israel in response to the war crimes occuring.
                    <strong> Both Padilla and Schiff voted to not block the arms sales</strong>, further allowing civilians to die in Gaza <a className="text-blue-600 underline" href="https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00455.htm#state">[source]</a>.
                </p>
                <p>
                    My goal is to advocate for peace, for the Palestinian civilians to have the ability to rebuild their cities, and allow for them to grieve.
                </p>
            </section>

            <section className={SECTION_CLASSNAMES}>
                <h3 className="font-bold text-l">Resources</h3>
                <p className="pl-2">Here&apos;s some resources that have helped me better understand what&apos;s going on.</p>
                <ul className="pl-2 list-disc">
                    {resources.map((r, i ) => {
                        return (<li className="mt-2" key={i}>
                            <span>{r.text}</span>
                            <a className={LINK_CLASSNAMES} href={r.link}> [source]</a>.
                        </li>);
                    })}
                </ul>
            </section>
        </main>
    );
};