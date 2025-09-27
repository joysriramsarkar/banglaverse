'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Wand2, Copy } from 'lucide-react';
import { performGrammarCheck } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from 'lucide-react';

const initialState = {
  correctedSentence: '',
  explanation: '',
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
      পরীক্ষা করুন
    </Button>
  );
}

export default function GrammarCheckClient() {
  const [state, formAction] = useFormState(performGrammarCheck, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: state.error,
      });
    }
  }, [state, toast]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'সফলভাবে কপি করা হয়েছে!' });
  };

  return (
    <Card className="shadow-lg">
      <form action={formAction}>
        <CardContent className="p-6">
          <Textarea
            name="sentence"
            placeholder="আপনার বাক্যটি এখানে দিন..."
            rows={5}
            className="text-base"
          />
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>

      {state?.correctedSentence && (
        <div className="p-6 pt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>সংশোধিত বাক্য</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => handleCopy(state.correctedSentence)}>
                <Copy className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-foreground/90">{state.correctedSentence}</p>
            </CardContent>
          </Card>
          
          {state.explanation && (
            <Alert className="mt-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>ব্যাখ্যা</AlertTitle>
              <AlertDescription>
                {state.explanation}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </Card>
  );
}
