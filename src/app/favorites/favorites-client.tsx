'use client';

import { useState } from 'react';
import { useFavorites } from '@/hooks/use-favorites';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, BookOpen, Volume2, Search, Download, ExternalLink, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function FavoritesClient() {
  const { favorites, removeFavorite, isLoaded } = useFavorites();
  const [searchFilter, setSearchFilter] = useState('');
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const { toast } = useToast();

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(text);
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleExport = () => {
    if (favorites.length === 0) return;
    const content = JSON.stringify(favorites, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banglaverse_favorites_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'প্রিয় শব্দের তালিকা ডাউনলোড হয়েছে!' });
  };

  const filteredFavorites = favorites.filter((fav) => {
    const query = searchFilter.toLowerCase().trim();
    if (!query) return true;
    return (
      fav.word.toLowerCase().includes(query) ||
      (fav.meaning && fav.meaning.toLowerCase().includes(query)) ||
      (fav.pronunciation && fav.pronunciation.toLowerCase().includes(query))
    );
  });

  if (!isLoaded) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg max-w-xl mx-auto p-6 bg-card/40">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-headline font-semibold">কোনো প্রিয় শব্দ নেই</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          অভিধানে কোনো শব্দ খুঁজে তার পাশে থাকা তারা (★) আইকনে ক্লিক করে প্রিয় তালিকায় যুক্ত করুন।
        </p>
        <Link href="/" className="inline-block mt-4">
          <Button variant="default" className="gap-2">
            <Search className="w-4 h-4" /> অভিধানে খুঁজুন
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="সংরক্ষিত শব্দ ফিল্টার করুন..."
            className="pr-8"
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-muted-foreground">
            মোট: {favorites.length}টি শব্দ {searchFilter && `(${filteredFavorites.length}টি দৃশ্যমান)`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1.5 h-9"
          >
            <Download className="w-3.5 h-3.5" /> রপ্তানি করুন
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFavorites.map((fav) => (
          <Card key={fav.word} className="flex flex-col shadow-sm hover:shadow transition-shadow border-border/80">
            <CardHeader className="flex-grow pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl text-primary font-headline font-bold">
                    {fav.word}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs mt-0.5">
                    {fav.pronunciation || 'উচ্চারণ নেই'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 text-primary"
                  onClick={() => speakText(fav.word)}
                  title="উচ্চারণ শুনুন"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking === fav.word ? 'text-accent animate-pulse' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-grow pb-3">
              <p className="text-sm text-foreground/90 font-medium">{fav.meaning}</p>
            </CardContent>
            <div className="p-3 pt-0 flex items-center justify-between border-t border-border/40 mt-auto">
              <Link href={`/?q=${encodeURIComponent(fav.word)}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-primary gap-1 px-2"
                >
                  <ExternalLink className="w-3 h-3" /> বিস্তারিত
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive gap-1 px-2"
                onClick={() => {
                  removeFavorite(fav.word);
                  toast({ title: `"${fav.word}" তালিকা থেকে মুছে ফেলা হয়েছে` });
                }}
              >
                <Trash2 className="w-3.5 h-3.5" /> মুছুন
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
