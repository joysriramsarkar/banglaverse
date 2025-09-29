import AdvancedCorrectionClient from './advanced-correction-client';

export default function AdvancedCorrectionPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary font-headline">উন্নত পাঠ্য সংশোধন</h1>
        <p className="mt-1 text-muted-foreground">বড় আকারের টেক্সট ডকুমেন্ট এখানে পেস্ট করে বানান ও ব্যাকরণ সংশোধন করুন।</p>
      </div>
      <AdvancedCorrectionClient />
    </div>
  );
}
