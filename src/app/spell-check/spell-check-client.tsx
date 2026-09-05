'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, Copy, Trash2, Upload, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { performSpellCheck, type SpellCheckResult } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const initialState: SpellCheckResult = {
  correctedText: '',
  suggestions: [],
  detailedSuggestions: [],
  stats: {
    totalWords: 0,
    errorCount: 0,
    accuracyPercent: 100,
  },
  error: null,
};

const SAMPLE_TEXTS = [
  'আমাদের স্কুলে সকল ছাত্রছাত্রীগণ উপস্থিত ছিল। ইতিমধ্যে প্রধান শিক্ষক আসিয়া সুন্দর বক্তব্য রাখিলেন।',
  'তিনি নির্দোষী প্রমাণিত হইয়াছেন। ফলশ্রুতিতে সকল মামলার সমাপ্তি ঘটিয়াছে।',
  'দারিদ্রতা কোনো অভিশাপ নয়, অধ্যায়ন ও পরিশ্রমের মাধ্যমে সাফল্য অর্জন সম্ভব।'
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="gap-2">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
      বানান পরীক্ষা করুন
    </Button>
  );
}

export default function SpellCheckClient() {
  const [state, formAction] = useActionState(performSpellCheck, initialState);
  const [inputText, setInputText] = useState('');
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

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: 'সফলভাবে কপি করা হয়েছে!' });
  };

  const handleClear = () => {
    setInputText('');
  };

  const handleApplySuggestion = (originalWord: string, replacementWord: string) => {
    const updated = inputText.replaceAll(originalWord, replacementWord);
    setInputText(updated);
    toast({
      title: `"${originalWord}" পরিবর্তন করে "${replacementWord}" করা হয়েছে!`,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
      toast({ title: `"${file.name}" ফাইলটি সফলভাবে লোড হয়েছে!` });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Sample Quick Buttons */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-accent" /> নমুনা বাক্য পরীক্ষা করুন:
        </span>
        {SAMPLE_TEXTS.map((sample, idx) => (
          <Button
            key={idx}
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => setInputText(sample)}
          >
            নমুনা {idx + 1}
          </Button>
        ))}
      </div>

      <Card className="shadow-md border-border">
        <form action={formAction}>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>আপনার বাংলা পাঠ্য নিচে লিখুন বা পেস্ট করুন:</span>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5 mr-1" /> ফাইল আপলোড
                </Button>
                {inputText && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    onClick={handleClear}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> খালি করুন
                  </Button>
                )}
              </div>
            </div>

            <Textarea
              name="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="আপনার বাংলা লেখাটি এখানে দিন..."
              rows={8}
              className="text-base font-body leading-relaxed"
              required
            />
          </CardContent>

          <div className="p-4 sm:p-6 pt-0 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 mt-2">
            <div className="text-xs text-muted-foreground">
              শব্দ সংখ্যা: {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} | অক্ষর: {inputText.length}
            </div>
            <SubmitButton />
          </div>
        </form>
      </Card>

      {/* Results Section */}
      {state && state.stats && state.stats.totalWords > 0 && (
        <div className="space-y-4 animate-fade-in">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center bg-secondary/30">
              <span className="text-xs text-muted-foreground">মোট শব্দ</span>
              <p className="text-xl font-bold text-foreground">{state.stats.totalWords}</p>
            </Card>
            <Card className={`p-3 text-center ${state.stats.errorCount > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <span className="text-xs text-muted-foreground">সন্দেহজনক শব্দ</span>
              <p className={`text-xl font-bold ${state.stats.errorCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                {state.stats.errorCount}
              </p>
            </Card>
            <Card className="p-3 text-center bg-secondary/30">
              <span className="text-xs text-muted-foreground">শুদ্ধতার মাত্রা</span>
              <p className="text-xl font-bold text-primary">{state.stats.accuracyPercent}%</p>
            </Card>
          </div>

          {/* Detailed Suggestions with 1-Click Replace */}
          {state.detailedSuggestions && state.detailedSuggestions.length > 0 ? (
            <Card className="border-amber-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  সন্দেহজনক বা ভুল বানান ও সম্ভাব্য সমাধান ({state.detailedSuggestions.length}টি)
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  প্রস্তাবিত শুদ্ধ শব্দটিতে ক্লিক করলে আপনার লেখায় স্বয়ংক্রিয়ভাবে প্রতিস্থাপিত হবে:
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {state.detailedSuggestions.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-md bg-muted/40 border border-border/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-destructive underline decoration-wavy text-sm">
                          {item.word}
                        </span>
                        <span className="text-[11px] text-muted-foreground">প্রস্তাবিত বানান:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.suggestions && item.suggestions.length > 0 ? (
                          item.suggestions.map((sug, sIdx) => (
                            <Badge
                              key={sIdx}
                              variant="secondary"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all text-xs py-0.5 px-2"
                              onClick={() => handleApplySuggestion(item.word, sug)}
                              title="লেখায় প্রতিস্থাপন করতে ক্লিক করুন"
                            >
                              {sug}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            অভিধানে সরাসরি বিকল্প নেই
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-500/30 bg-green-500/5 p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-base text-green-800 dark:text-green-300">
                চমৎকার! কোনো বানান ভুল পাওয়া যায়নি
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                আপনার লেখার সকল শব্দ আমাদের প্রমিত বাংলা শব্দকোষের সাথে মিলে গেছে।
              </p>
            </Card>
          )}

          {/* Copy Clean Text */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(inputText)}
              className="gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              লেখাটি কপি করুন
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
