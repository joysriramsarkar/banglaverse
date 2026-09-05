'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, Download, Upload, Trash2, Copy, FileText, Sparkles, CheckCheck } from 'lucide-react';
import { performAdvancedCorrection } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const initialState = {
  correctedText: '',
  highlightedCorrections: '',
  stats: undefined as { changedCount?: number } | undefined,
  isOffline: false,
  error: null,
};

const SAMPLE_DOC = `বাংলা ভাষার সমৃদ্ধ সাহিত্য ঐতিহ্য রয়েছে। ইতিমধ্যে বহু সাহিত্যিক এই ভাষাকে বিশ্বদরবারে পরিচিত করিয়াছেন। তবে আমাদের দৈনন্দিন লেখায় সকল ছাত্রছাত্রীগণ অনেক সময় বানান ও ব্যাকরণগত অসতর্কতা প্রদর্শন করিয়া থাকে।

অত্র প্রবন্ধে আমরা উপরোক্ত বিষয়সমূহ নিয়ে আলোচনা করিব। তিনি একজন নিরপরাধী মানুষ ছিলেন কিন্তু দারিদ্রতা তাহার জীবনকে দুর্বিষহ করিয়া তুলিয়াছিল।`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="gap-2">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
      সম্পূর্ণ ডকুমেন্ট সংশোধন করুন
    </Button>
  );
}

export default function AdvancedCorrectionClient() {
  const [state, formAction] = useActionState(performAdvancedCorrection, initialState);
  const [documentText, setDocumentText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state && 'error' in state && state.error) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: state.error,
      });
    }
  }, [state, toast]);

  const handleDownload = (content: string, filename: string, mimeType: string = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: `"${filename}" ডাউনলোড শুরু হয়েছে!` });
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: 'সংশোধিত পাঠ্য ক্লিপবোর্ডে কপি করা হয়েছে!' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setDocumentText(content);
      toast({ title: `"${file.name}" সফলভাবে লোড হয়েছে!` });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Sample Quick Testing */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>দ্রুত পরীক্ষার জন্য:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => setDocumentText(SAMPLE_DOC)}
          >
            নমুনা ডকুমেন্ট লোড করুন
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.md,.doc"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5" /> ডকুমেন্ট ফাইল আপলোড
          </Button>
          {documentText && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
              onClick={() => setDocumentText('')}
            >
              <Trash2 className="w-3.5 h-3.5" /> খালি করুন
            </Button>
          )}
        </div>
      </div>

      {/* Editor Card */}
      <Card className="shadow-md border-border">
        <form action={formAction}>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <Textarea
              name="text"
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="আপনার সম্পূর্ণ লেখা বা ডকুমেন্ট এখানে পেস্ট করুন..."
              rows={12}
              className="text-base font-body leading-relaxed"
              required
            />
          </CardContent>

          <div className="p-4 sm:p-6 pt-0 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 mt-2">
            <div className="text-xs text-muted-foreground space-x-2">
              <span>শব্দ: {documentText.trim() ? documentText.trim().split(/\s+/).length : 0}</span>
              <span>•</span>
              <span>অক্ষর: {documentText.length}</span>
              <span>•</span>
              <span>অনুচ্ছেদ: {documentText.trim() ? documentText.trim().split(/\n\s*\n/).length : 0}</span>
            </div>
            <SubmitButton />
          </div>
        </form>
      </Card>

      {/* Results View */}
      {state && 'correctedText' in state && state.correctedText && (
        <div className="space-y-4 animate-fade-in">
          <Tabs defaultValue="corrected" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="corrected" className="gap-2 text-sm">
                <CheckCheck className="w-4 h-4" /> সম্পূর্ণ সংশোধিত পাঠ্য
              </TabsTrigger>
              <TabsTrigger value="highlighted" className="gap-2 text-sm">
                <FileText className="w-4 h-4" /> ত্রুটি ও সংশোধন চিহ্নিত
              </TabsTrigger>
            </TabsList>

            {/* Corrected Text Tab */}
            <TabsContent value="corrected" className="mt-3">
              <Card className="shadow-md border-border">
                <CardHeader className="bg-secondary/20 pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-headline">পরিশুদ্ধ টেক্সট</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => handleCopy(state.correctedText)}
                    >
                      <Copy className="w-3.5 h-3.5" /> কপি
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => handleDownload(state.correctedText, 'banglaverse_corrected_doc.txt')}
                    >
                      <Download className="w-3.5 h-3.5" /> TXT ডাউনলোড
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 hidden sm:inline-flex"
                      onClick={() => handleDownload(`<html><body style="font-family: Arial, sans-serif; line-height: 1.6;">${state.correctedText.replace(/\n/g, '<br/>')}</body></html>`, 'banglaverse_corrected_doc.doc', 'application/msword')}
                    >
                      <Download className="w-3.5 h-3.5" /> Word ডাউনলোড
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 max-h-[500px] overflow-y-auto">
                  <p className="whitespace-pre-wrap font-body leading-relaxed text-base text-foreground/90">
                    {state.correctedText}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Highlighted Corrections Tab */}
            <TabsContent value="highlighted" className="mt-3">
              <Card className="shadow-md border-border">
                <CardHeader className="bg-secondary/20 pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-headline">ত্রুটি চিহ্নিত সংস্করণ</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => handleDownload(state.highlightedCorrections, 'banglaverse_highlighted_corrections.html', 'text/html;charset=utf-8')}
                  >
                    <Download className="w-3.5 h-3.5" /> HTML রিপোর্ট ডাউনলোড
                  </Button>
                </CardHeader>
                <CardContent className="p-5 max-h-[500px] overflow-y-auto">
                  <div
                    className="prose prose-neutral dark:prose-invert max-w-none font-body leading-relaxed text-base"
                    dangerouslySetInnerHTML={{
                      __html: state.highlightedCorrections.replace(/\n/g, '<br />')
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
