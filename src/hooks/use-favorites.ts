'use client';

import { useState, useEffect, useCallback } from 'react';

export type FavoriteWord = {
  word: string;
  meaning: string;
  pronunciation: string;
};

const FAVORITES_KEY = 'banglaverse_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteWord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage', error);
    }
    setIsLoaded(true);
  }, []);

  const addFavorite = useCallback((word: FavoriteWord) => {
    const newFavorites = [...favorites, word];
    setFavorites(newFavorites);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Failed to save favorites to localStorage', error);
    }
  }, [favorites]);

  const removeFavorite = useCallback((word: string) => {
    const newFavorites = favorites.filter(fav => fav.word !== word);
    setFavorites(newFavorites);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Failed to save favorites to localStorage', error);
    }
  }, [favorites]);

  const isFavorite = useCallback((word: string) => {
    return favorites.some(fav => fav.word === word);
  }, [favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorite, isLoaded };
}
