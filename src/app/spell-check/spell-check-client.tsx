'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
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
      সন্দেহজনক শব্দ খুঁজুন
    </Button>
  );
}

export default function SpellCheckClient() {
  const [state, formAction] = useActionState(performSpellCheck, initialState);
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

      {state && 'suggestions' in state && Array.isArray(state.suggestions) && state.suggestions.length > 0 && (
        <div className="p-6 pt-0">
            <Card>
              <CardHeader>
                <CardTitle>সন্দেহজনক বা ভুল বানানের তালিকা</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {state.suggestions.map((suggestion, index) => (
                    <Badge key={index} variant="outline">{suggestion}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
        </div>
      )}
    </Card>
  );
}
