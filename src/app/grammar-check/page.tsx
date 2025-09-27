import GrammarCheckClient from './grammar-check-client';

export default function GrammarCheckPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary font-headline">ব্যাকরণ পরীক্ষক</h1>
        <p className="mt-1 text-muted-foreground">আপনার বাংলা বাক্যের ব্যাকরণ পরীক্ষা ও সংশোধন করুন।</p>
      </div>
      <GrammarCheckClient />
    </div>
  );
}
