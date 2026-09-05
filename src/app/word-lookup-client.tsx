'use client';

import { useState, useTransition, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Search, Star, Volume2, Copy, History, Sparkles, X } from 'lucide-react';
import { getWordDetails, type WordDetails } from './actions';
import { useFavorites, type FavoriteWord } from '@/hooks/use-favorites';
import { useToast } from '@/hooks/use-toast';

const POPULAR_SEARCHES = ['জ্ঞান', 'অনুরণন', 'সৌন্দর্য', 'বন্ধুত্ব', 'প্রকৃতি', 'carry-on', 'freedom'];

export default function WordLookupClient() {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<WordDetails | null>(null);
  const [similarWords, setSimilarWords] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();

  // Load recent searches and check ?q= query param on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('banglaverse_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) {
          setSearchQuery(q);
          executeSearch(q);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveRecentSearch = (word: string) => {
    try {
      const trimmed = word.trim();
      if (!trimmed) return;
      const updated = [trimmed, ...recentSearches.filter(w => w.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem('banglaverse_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('banglaverse_recent_searches');
  };

  const executeSearch = (word: string) => {
    const term = word.trim();
    if (!term) return;

    setSearchQuery(term);
    setSimilarWords([]);

    startTransition(async () => {
      const res = await getWordDetails(term);
      if ('error' in res && res.error) {
        toast({
          variant: "destructive",
          title: "শব্দটি পাওয়া যায়নি",
          description: res.error,
        });
        setResult(null);
        if ('similarWords' in res && res.similarWords) {
          setSimilarWords(res.similarWords);
        }
      } else {
        setResult(res as WordDetails);
        saveRecentSearch(term);
      }
    });
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeSearch(searchQuery);
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
      toast({ title: "প্রিয় তালিকা থেকে মুছে ফেলা হয়েছে" });
    } else {
      addFavorite(fav);
      toast({ title: "প্রিয় তালিকায় যোগ করা হয়েছে" });
    }
  };

  // Text to Speech
  const speakText = (text: string, lang: 'bn-BD' | 'en-US' = 'bn-BD') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast({ title: "আপনার ব্রাউজার টেক্সট-টু-স্পিচ সমর্থন করে না" });
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Copy word details
  const handleCopyDetails = () => {
    if (!result) return;
    const textToCopy = `শব্দ: ${result.word}\nউচ্চারণ: ${result.pronunciation}\nঅর্থ: ${result.meaning}`;
    navigator.clipboard.writeText(textToCopy);
    toast({ title: "শব্দের বিবরণ কপি করা হয়েছে!" });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="বাংলা বা ইংরেজি শব্দ লিখুন... (যেমন: বই, carry-on, জ্ঞান)"
            className="text-lg pr-10 shadow-sm"
            required
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="মুছে ফেলুন"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={isPending} size="lg" className="shadow-sm">
          {isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
          <span className="ml-2 hidden sm:inline">অনুসন্ধান</span>
        </Button>
      </form>

      {/* Quick Search Suggestions & Recent Searches */}
      <div className="space-y-3">
        {recentSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 font-medium">
              <History className="w-3.5 h-3.5" /> সাম্প্রতিক:
            </span>
            {recentSearches.map((item, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="cursor-pointer hover:bg-accent/20 transition-colors"
                onClick={() => executeSearch(item)}
              >
                {item}
              </Badge>
            ))}
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-xs text-muted-foreground hover:text-destructive underline ml-1"
            >
              সাফ করুন
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> জনপ্রিয় অনুসন্ধান:
          </span>
          {POPULAR_SEARCHES.map((item, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => executeSearch(item)}
            >
              {item}
            </Badge>
          ))}
        </div>
      </div>

      {/* Loading Spinner */}
      {isPending && (
        <div className="flex flex-col justify-center items-center py-12 space-y-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">অভিধানে খোঁজ করা হচ্ছে...</p>
        </div>
      )}

      {/* Similar Words when not found */}
      {!result && similarWords.length > 0 && (
        <Card className="border-accent/40 bg-accent/5 p-4 animate-fade-in">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Search className="w-4 h-4 text-accent" />
            আপনি কি এগুলো খুঁজছেন?
          </h4>
          <div className="flex flex-wrap gap-2">
            {similarWords.map((sim, i) => (
              <Badge
                key={i}
                variant="outline"
                className="cursor-pointer hover:bg-accent/20 text-base py-1 px-3"
                onClick={() => executeSearch(sim)}
              >
                {sim}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Word Details Card */}
      {result && (
        <Card className="animate-fade-in shadow-md border-border/80">
          <CardHeader className="flex flex-row items-start justify-between pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl sm:text-4xl font-headline text-primary font-bold">
                  {result.word}
                </CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-9 h-9"
                  onClick={() => speakText(result.word, 'bn-BD')}
                  title="উচ্চারণ শুনুন (বাংলা)"
                  aria-label="উচ্চারণ শুনুন"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-accent animate-pulse' : 'text-primary'}`} />
                </Button>
              </div>
              {result.pronunciation && (
                <p className="text-sm text-muted-foreground font-mono">
                  উচ্চারণ: {result.pronunciation}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyDetails}
                title="বিবরণ কপি করুন"
                aria-label="কপি করুন"
              >
                <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavoriteToggle}
                title={isFavorite(result.word) ? "প্রিয় তালিকা থেকে সরান" : "প্রিয় তালিকায় যোগ করুন"}
                aria-label="প্রিয় তালিকায় যোগ করুন"
              >
                <Star className={`w-5 h-5 ${isFavorite(result.word) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-2">
            {/* Meaning */}
            <div className="bg-secondary/20 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  অর্থ (English):
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => speakText(result.meaning, 'en-US')}
                >
                  <Volume2 className="w-3 h-3 mr-1" /> শুনুন
                </Button>
              </div>
              <p className="text-lg font-medium text-foreground">{result.meaning}</p>
            </div>

            {/* Bangla Synonyms */}
            {result.synonyms && result.synonyms.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    বাংলা সমার্থক শব্দ:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.synonyms.map((synonym, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20 text-sm py-1 px-2.5 transition-colors"
                        onClick={() => executeSearch(synonym)}
                        title={`"${synonym}" শব্দটি খুঁজুন`}
                      >
                        {synonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* English Synonyms */}
            {result.englishSynonyms && result.englishSynonyms.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    ইংরেজি সমার্থক শব্দ (English Synonyms):
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.englishSynonyms.map((synonym, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent/20 text-sm py-1 px-2.5 transition-colors"
                        onClick={() => executeSearch(synonym)}
                      >
                        {synonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Examples */}
            {result.examples && result.examples.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    বাক্যে প্রয়োগের উদাহরণ:
                  </h3>
                  <ul className="space-y-2 text-foreground/90">
                    {result.examples.map((example, index) => (
                      <li
                        key={index}
                        className="p-2.5 rounded bg-muted/40 text-sm border-l-2 border-primary"
                        dangerouslySetInnerHTML={{
                          __html: example.replace(/<b>/g, '<strong class="text-primary font-semibold">').replace(/<\/b>/g, '</strong>')
                        }}
                      />
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