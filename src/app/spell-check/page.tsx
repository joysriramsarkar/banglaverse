import SpellCheckClient from './spell-check-client';

export default function SpellCheckPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary font-headline">বানান পরীক্ষক</h1>
        <p className="mt-1 text-muted-foreground">আপনার বাংলা লেখার বানান পরীক্ষা ও সংশোধন করুন।</p>
      </div>
      <SpellCheckClient />
    </div>
  );
}
