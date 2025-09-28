'use client';
import { useFavorites } from '@/hooks/use-favorites';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FavoritesClient() {
  const { favorites, removeFavorite, isLoaded } = useFavorites();

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
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">কোনো প্রিয় শব্দ নেই</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          অভিধান থেকে আপনার পছন্দের শব্দ যোগ করুন।
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {favorites.map((fav) => (
        <Card key={fav.word} className="flex flex-col">
          <CardHeader className="flex-grow">
            <CardTitle className="text-2xl text-primary font-headline">{fav.word}</CardTitle>
            <CardDescription>{fav.pronunciation}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p>{fav.meaning}</p>
          </CardContent>
          <div className="p-4 pt-0">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive-foreground hover:bg-destructive"
              onClick={() => removeFavorite(fav.word)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              মুছে ফেলুন
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
