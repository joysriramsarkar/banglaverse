import DocumentConvertClient from './document-convert-client';

export default function DocumentConvertPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary font-headline">ডকুমেন্ট রূপান্তর ও এক্সপোর্ট</h1>
        <p className="mt-1 text-muted-foreground">বাংলা টেক্সট ডকুমেন্ট আপলোড করুন, পরিসংখ্যান দেখুন এবং Word (.doc), Text (.txt), Markdown বা HTML ফরম্যাটে রূপান্তর করুন।</p>
      </div>
      <DocumentConvertClient />
    </div>
  );
}
