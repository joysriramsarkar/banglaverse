import FavoritesClient from './favorites-client';

export default function FavoritesPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary font-headline">প্রিয় শব্দসমূহ</h1>
        <p className="mt-1 text-muted-foreground">আপনার সংরক্ষিত শব্দগুলো এখানে দেখতে পারেন।</p>
      </div>
      <FavoritesClient />
    </div>
  );
}
