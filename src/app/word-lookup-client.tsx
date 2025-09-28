'use client';
import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Search, Star } from 'lucide-react';
import { getWordDetails } from './actions';
import { useFavorites, type FavoriteWord } from '@/hooks/use-favorites';
import { useToast } from '@/hooks/use-toast';

type WordDetails = {
  word: string;
  pronunciation: string;
  meaning: string;
  examples: string[];
  synonyms: string[];
  error?: string;
};

export default function WordLookupClient() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<WordDetails | null>(null);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();

  const handleSearch = (formData: FormData) => {
    const word = formData.get('word') as string;
    if (!word) return;

    startTransition(async () => {
      const res = await getWordDetails(word);
      if (res.error) {
        toast({
          variant: "destructive",
          title: "ত্রুটি",
          description: res.error,
        });
        setResult(null);
      } else {
        setResult(res as WordDetails);
      }
    });
  };
  
  const handleFavoriteToggle = () => {
    if (!result || !result.word) return;

    const fav: FavoriteWord = {
      word: result.word,
      pronunciation: result.pronunciation,
      meaning: result.meaning
    };

    if (isFavorite(result.word)) {
      removeFavorite(result.word);
      toast({ title: "প্রিয় তালিকা থেকে মুছে ফেলা হয়েছে" });
    } else {
      addFavorite(fav);
      toast({ title: "প্রিয় তালিকায় যোগ করা হয়েছে" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form action={handleSearch} className="flex items-center gap-2 mb-8">
        <Input
          name="word"
          type="text"
          placeholder="শব্দ খুঁজুন..."
          className="text-lg"
          required
        />
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? <Loader2 className="animate-spin" /> : <Search />}
          <span className="ml-2 hidden sm:inline">অনুসন্ধান</span>
        </Button>
      </form>

      {isPending && (
        <div className="flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {result && (
        <Card className="animate-fade-in shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-headline text-primary">{result.word}</CardTitle>
              <p className="text-muted-foreground">{result.pronunciation}</p>
            </div>
             <Button
                variant="ghost"
                size="icon"
                onClick={handleFavoriteToggle}
                aria-label="প্রিয় তালিকায় যোগ করুন"
              >
                <Star className={isFavorite(result.word) ? 'fill-accent text-accent' : ''} />
              </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">অর্থ (English):</h3>
              <p className="text-foreground/90">{result.meaning}</p>
            </div>
            
            {result.synonyms && result.synonyms.length > 0 && (
            <>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg">সমার্থক শব্দ:</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                  result.synonyms.map((synonym, index) => (
                    <Badge key={index} variant="secondary">{synonym}</Badge>
                  ))
              </div>
            </div>
            </>
            )}

            {result.examples && result.examples.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg">উদাহরণ:</h3>
                  <ul className="list-disc list-inside space-y-1 mt-2 text-foreground/80">
                    {result.examples.map((example, index) => (
                      <li key={index}>{example}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
