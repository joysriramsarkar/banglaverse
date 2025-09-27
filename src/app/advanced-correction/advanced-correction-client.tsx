'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Wand2, Download } from 'lucide-react';
import { performAdvancedCorrection } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const initialState = {
  correctedText: '',
  highlightedCorrections: '',
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
      সংশোধন করুন
    </Button>
  );
}

export default function AdvancedCorrectionClient() {
  const [state, formAction] = useFormState(performAdvancedCorrection, initialState);
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
  
  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: `${filename} ডাউনলোড শুরু হয়েছে।` });
  };


  return (
    <div>
      <Card className="shadow-lg mb-8">
        <form action={formAction}>
          <CardContent className="p-6">
            <Textarea
              name="text"
              placeholder="আপনার সম্পূর্ণ লেখা বা ডকুমেন্ট এখানে পেস্ট করুন..."
              rows={15}
              className="text-base"
            />
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
      
      {state?.correctedText && (
        <Tabs defaultValue="corrected" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="corrected">সংশোধিত পাঠ্য</TabsTrigger>
            <TabsTrigger value="highlighted">ত্রুটি চিহ্নিত</TabsTrigger>
          </TabsList>
          <TabsContent value="corrected">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                   <CardTitle>সম্পূর্ণ সংশোধিত পাঠ্য</CardTitle>
                    <Button variant="outline" onClick={() => handleDownload(state.correctedText, 'corrected_text.txt')}>
                        <Download className="mr-2 h-4 w-4" />
                        ডাউনলোড
                    </Button>
                </div>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                <p className="whitespace-pre-wrap">{state.correctedText}</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="highlighted">
             <Card>
              <CardHeader>
                 <div className="flex justify-between items-center">
                    <CardTitle>ত্রুটি চিহ্নিত করা পাঠ্য</CardTitle>
                     <Button variant="outline" onClick={() => handleDownload(state.highlightedCorrections, 'highlighted_corrections.txt')}>
                        <Download className="mr-2 h-4 w-4" />
                        ডাউনলোড
                    </Button>
                </div>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: state.highlightedCorrections.replace(/\n/g, '<br />') }} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

    </div>
  );
}
