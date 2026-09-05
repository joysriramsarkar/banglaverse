'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Download, FileText, Trash2, Copy, ArrowRight, BookOpen, Sparkles, CheckCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function DocumentConvertClient() {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      toast({ title: `"${file.name}" ফাইলটি সফলভাবে লোড হয়েছে!` });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownload = (type: 'txt' | 'doc' | 'md' | 'html') => {
    if (!content.trim()) {
      toast({ variant: 'destructive', title: 'কোনো লেখা নেই!', description: 'অনুগ্রহ করে কিছু লেখা দিন বা ফাইল আপলোড করুন।' });
      return;
    }

    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'banglaverse_doc';
    let blobContent = content;
    let mimeType = 'text/plain;charset=utf-8';
    let ext = 'txt';

    if (type === 'doc') {
      ext = 'doc';
      mimeType = 'application/msword';
      blobContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${baseName}</title>
        <style>
          body { font-family: 'SolaimanLipi', 'Kalpurush', 'Arial', sans-serif; font-size: 14pt; line-height: 1.6; }
        </style>
        </head>
        <body>
          <div>${content.replace(/\n/g, '<br/>')}</div>
        </body>
        </html>
      `;
    } else if (type === 'md') {
      ext = 'md';
      mimeType = 'text/markdown;charset=utf-8';
      blobContent = content;
    } else if (type === 'html') {
      ext = 'html';
      mimeType = 'text/html;charset=utf-8';
      blobContent = `<!DOCTYPE html><html lang="bn"><head><meta charset="utf-8"><title>${baseName}</title></head><body>${content.replace(/\n/g, '<br/>')}</body></html>`;
    }

    const blob = new Blob([blobContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}_converted.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: `"${baseName}_converted.${ext}" ডাউনলোড শুরু হয়েছে!` });
  };

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    toast({ title: 'ক্লিপবোর্ডে কপি করা হয়েছে!' });
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const sentences = content.trim() ? content.split(/[।!?]+/).filter(Boolean).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 150));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Upload Zone & Actions */}
      <Card className="shadow-md border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-headline">ডকুমেন্ট লোড ও এডিটর</CardTitle>
              <CardDescription>
                টেক্সট বা মার্কডাউন ফাইল আপলোড করুন অথবা সরাসরি নিচে লিখুন
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.md,.html,.json,.csv"
                className="hidden"
              />
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" /> ফাইল নির্বাচন করুন
              </Button>
              {content && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setContent('');
                    setFileName('');
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> মুছুন
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="আপনার ডকুমেন্টের লেখা এখানে পেস্ট করুন বা ফাইল আপলোড করুন..."
            rows={12}
            className="text-base font-body leading-relaxed"
          />

          {/* Document Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="bg-secondary/30 p-2 rounded">
              <span className="text-[11px] text-muted-foreground block">মোট শব্দ</span>
              <span className="text-base font-bold text-foreground">{words}</span>
            </div>
            <div className="bg-secondary/30 p-2 rounded">
              <span className="text-[11px] text-muted-foreground block">অক্ষর সংখ্যা</span>
              <span className="text-base font-bold text-foreground">{chars}</span>
            </div>
            <div className="bg-secondary/30 p-2 rounded">
              <span className="text-[11px] text-muted-foreground block">বাক্য সংখ্যা</span>
              <span className="text-base font-bold text-foreground">{sentences}</span>
            </div>
            <div className="bg-secondary/30 p-2 rounded">
              <span className="text-[11px] text-muted-foreground block">পড়ার আনুমানিক সময়</span>
              <span className="text-base font-bold text-primary">{words > 0 ? `~${readingTimeMinutes} মিনিট` : '০'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Formats Card */}
      <Card className="shadow-md border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-headline flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            কাঙ্ক্ষিত ফরম্যাটে রূপান্তর ও ডাউনলোড করুন
          </CardTitle>
          <CardDescription>
            নিচের যেকোনো ফরম্যাটে এক ক্লিকে ডকুমেন্টটি সংরক্ষণ করুন:
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1 hover:border-primary"
            onClick={() => handleDownload('doc')}
            disabled={!content.trim()}
          >
            <FileText className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-sm">Word Document (.doc)</span>
            <span className="text-[11px] text-muted-foreground">মাইক্রোসফট ওয়ার্ড ফাইল</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1 hover:border-primary"
            onClick={() => handleDownload('txt')}
            disabled={!content.trim()}
          >
            <FileText className="w-6 h-6 text-emerald-600" />
            <span className="font-semibold text-sm">Plain Text (.txt)</span>
            <span className="text-[11px] text-muted-foreground">সাধারণ টেক্সট ফাইল</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1 hover:border-primary"
            onClick={() => handleDownload('md')}
            disabled={!content.trim()}
          >
            <FileText className="w-6 h-6 text-purple-600" />
            <span className="font-semibold text-sm">Markdown (.md)</span>
            <span className="text-[11px] text-muted-foreground">মার্কডাউন ফরম্যাট</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1 hover:border-primary"
            onClick={() => handleDownload('html')}
            disabled={!content.trim()}
          >
            <FileText className="w-6 h-6 text-orange-600" />
            <span className="font-semibold text-sm">Web HTML (.html)</span>
            <span className="text-[11px] text-muted-foreground">ওয়েব পেজ ফরম্যাট</span>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Transfer to other tools */}
      {content.trim() && (
        <Card className="border-accent/40 bg-accent/5 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent" />
                এই লেখার বানান ও ব্যাকরণ পরীক্ষা করবেন?
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                লোডকৃত টেক্সট নিয়ে সরাসরি আমাদের অন্যান্য ভাষা টুলে চলে যান:
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                onClick={handleCopy}
              >
                <Copy className="w-3.5 h-3.5" /> কপি করুন
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => router.push('/advanced-correction')}
              >
                ডকুমেন্ট সংশোধন <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
