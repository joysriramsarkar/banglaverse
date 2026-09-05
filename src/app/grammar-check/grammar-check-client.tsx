'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, Copy, CheckCircle2, Volume2, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { performGrammarCheck } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';

const initialState = {
  correctedSentence: '',
  explanation: '',
  rulesApplied: [] as string[],
  isOffline: false,
  error: null,
};

const SAMPLE_SENTENCES = [
  'সকল শিক্ষকগণ আসিয়া উপস্থিত হইলেন।',
  'ইতিমধ্যে উপরোক্ত বিষয়ে চূড়ান্ত সিদ্ধান্ত হইয়াছে।',
  'তিনি নির্দোষী কিন্তু ফলশ্রুতিতে শাস্তি পাইলেন।',
  'আমি ভাত খাইয়া এখন স্কুলে যাইব।'
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="gap-2">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
      ব্যাকরণ পরীক্ষা করুন
    </Button>
  );
}

export default function GrammarCheckClient() {
  const [state, formAction] = useActionState(performGrammarCheck, initialState);
  const [inputSentence, setInputSentence] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
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
    toast({ title: 'সংশোধিত বাক্য কপি করা হয়েছে!' });
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Sample Quick Testing */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-accent" /> নমুনা বাক্য পরীক্ষা করুন:
        </span>
        {SAMPLE_SENTENCES.map((sample, idx) => (
          <Button
            key={idx}
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => setInputSentence(sample)}
          >
            নমুনা {idx + 1}
          </Button>
        ))}
      </div>

      {/* Input Card */}
      <Card className="shadow-md border-border">
        <form action={formAction}>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>পরীক্ষার জন্য একটি বা একাধিক বাক্য লিখুন:</span>
              {inputSentence && (
                <button
                  type="button"
                  onClick={() => setInputSentence('')}
                  className="text-muted-foreground hover:text-destructive underline"
                >
                  খালি করুন
                </button>
              )}
            </div>
            <Textarea
              name="sentence"
              value={inputSentence}
              onChange={(e) => setInputSentence(e.target.value)}
              placeholder="আপনার বাংলা বাক্যটি এখানে লিখুন... (যেমন: সকল শিক্ষকগণ আসিয়া উপস্থিত হইলেন।)"
              rows={4}
              className="text-base font-body leading-relaxed"
              required
            />
          </CardContent>
          <div className="p-4 sm:p-6 pt-0 flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </Card>

      {/* Result Display */}
      {state && 'correctedSentence' in state && state.correctedSentence && (
        <div className="space-y-4 animate-fade-in">
          {/* Correction Comparison Card */}
          <Card className="shadow-md border-border overflow-hidden">
            <CardHeader className="bg-secondary/20 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                ফলাফল ও ব্যাকরণিক বিশ্লেষণ
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => speakText(state.correctedSentence)}
                  title="উচ্চারণ শুনুন"
                  aria-label="শুনুন"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-accent animate-pulse' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopy(state.correctedSentence)}
                  title="কপি করুন"
                  aria-label="কপি করুন"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Diff Box */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3.5 rounded-lg bg-muted/50 border border-border/80">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    মূল বাক্য:
                  </span>
                  <p className="text-base text-foreground/80">{inputSentence || 'প্রদত্ত বাক্য'}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-primary/10 border border-primary/30">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary block mb-1 flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5" /> শুদ্ধ রূপ:
                  </span>
                  <p className="text-base font-medium text-foreground">{state.correctedSentence}</p>
                </div>
              </div>

              {/* Rules Applied Badges */}
              {state.rulesApplied && state.rulesApplied.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1.5 font-medium">
                    চিহ্নিত ব্যাকরণিক নিয়মাবলি:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {state.rulesApplied.map((rule, rIdx) => (
                      <Badge key={rIdx} variant="secondary" className="text-xs">
                        {rule}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation Alert */}
              {state.explanation && (
                <Alert className="bg-background border-border">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-sm font-semibold">বিশ্লেষণ ও ব্যাখ্যা</AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm text-foreground/80 leading-relaxed mt-1">
                    {state.explanation}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
