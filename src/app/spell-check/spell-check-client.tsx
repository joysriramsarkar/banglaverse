'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Wand2, Copy } from 'lucide-react';
import { performSpellCheck } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const initialState = {
  correctedText: '',
  suggestions: [],
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

export default function SpellCheckClient() {
  const [state, formAction] = useFormState(performSpellCheck, initialState);
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
            name="text"
            placeholder="আপনার লেখাটি এখানে দিন..."
            rows={10}
            className="text-base"
          />
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>

      {state && (state.correctedText || state.suggestions.length > 0) && (
        <div className="p-6 pt-0">
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>সংশোধিত পাঠ্য</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(state.correctedText)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90">{state.correctedText}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>বানানের পরামর্শ</CardTitle>
              </CardHeader>
              <CardContent>
                {state.suggestions.length > 0 ? (
                   <div className="flex flex-wrap gap-2">
                    {state.suggestions.map((suggestion, index) => (
                      <Badge key={index} variant="outline">{suggestion}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">কোনো পরামর্শ পাওয়া যায়নি।</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </Card>
  );
}
