import Link from 'next/link';

// A reusable card component for the homepage
function HomeCard({ href, title, description, cta }: 
  { href: string, title: string, description: string, cta: string }) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      <h2 className="font-semibold text-lg text-gray-900">{title}</h2>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      <div className="mt-4">
        <Link 
          href={href} 
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="space-y-4 max-w-2xl mx-auto">
      <HomeCard
        href="/start"
        title="Start a Speech Sprint"
        description="Pick your language and topic, then practice in a 90-second sprint."
        cta="Start Session"
      />
      <HomeCard
        href="/due"
        title="Reviews Due"
        description="Spaced repetition keeps your pronunciation sticky."
        cta="Open Reviews"
      />
    </main>
  );
}