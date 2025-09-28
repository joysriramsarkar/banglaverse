import { renderHook, act } from '@testing-library/react';
import { useFavorites, FavoriteWord } from './use-favorites';

const mockWord1: FavoriteWord = { word: 'test1', meaning: 'meaning1', pronunciation: 'pronunciation1' };
const mockWord2: FavoriteWord = { word: 'test2', meaning: 'meaning2', pronunciation: 'pronunciation2' };
const mockWord3: FavoriteWord = { word: 'test3', meaning: 'meaning3', pronunciation: 'pronunciation3' };

describe('useFavorites', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should add a favorite word', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockWord1);
    });

    expect(result.current.favorites).toEqual([mockWord1]);
    expect(result.current.isFavorite('test1')).toBe(true);
  });

  it('should handle multiple additions in quick succession', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockWord1);
      result.current.addFavorite(mockWord2);
      result.current.addFavorite(mockWord3);
    });

    expect(result.current.favorites).toEqual([mockWord1, mockWord2, mockWord3]);
    expect(localStorage.getItem('banglaverse_favorites')).toEqual(JSON.stringify([mockWord1, mockWord2, mockWord3]));
  });
});