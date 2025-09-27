import WordLookupClient from './word-lookup-client';

export default function Home() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary font-headline">BanglaVerse-এ স্বাগতম</h1>
        <p className="mt-2 text-lg text-foreground/80">আপনার বাংলা ভাষা সঙ্গী</p>
      </div>
      <WordLookupClient />
    </div>
  );
}
