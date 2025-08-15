export default function Link({ href, children }: { href: string, children: React.ReactNode }) {
    
    return (
        <a href={href} className="text-blue-500 hover:underline">
            {children}
        </a>
    )
};