import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { purchaseBook as purchaseBookApi, getMyPurchases } from '../src/api/purchases';
import { useAuth } from './AuthContext';

export interface PurchasedBook {
  id: string;
  title: string;
  fileUrl?: string;
  localPath?: string;
}

interface LibraryContextType {
  purchasedBooks: PurchasedBook[];
  purchaseBook: (book: any) => Promise<boolean>;
  isBookPurchased: (bookId: string) => boolean;
  isLoading: boolean;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [purchasedBooks, setPurchasedBooks] = useState<PurchasedBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPurchases = async () => {
      if (!user) {
        setPurchasedBooks([]);
        return;
      }
      setIsLoading(true);
      try {
        // First load from local storage for offline support
        const localKey = `purchasedBooks_${user.id}`;
        const localData = await AsyncStorage.getItem(localKey);
        if (localData) {
          setPurchasedBooks(JSON.parse(localData));
        }

        // Then sync with backend
        try {
          const response = await getMyPurchases();
          const backendPurchases = response.data.map((p: any) => ({
            id: p.bookId,
            title: p.book.title,
            fileUrl: p.book.fileUrl,
          }));
          setPurchasedBooks(backendPurchases);
          await AsyncStorage.setItem(localKey, JSON.stringify(backendPurchases));
        } catch (apiError) {
          console.log('Backend sync failed, using offline data');
        }
      } catch (error) {
        console.error('Error loading purchased books:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPurchases();
  }, [user]);

  const purchaseBook = async (book: any): Promise<boolean> => {
    if (!user) return false;
    try {
      await purchaseBookApi(book.id);
      
      const newPurchase: PurchasedBook = {
        id: book.id,
        title: book.title,
        fileUrl: book.fileUrl,
      };
      
      const updated = [...purchasedBooks, newPurchase];
      setPurchasedBooks(updated);
      await AsyncStorage.setItem(`purchasedBooks_${user.id}`, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Purchase failed:', error);
      return false;
    }
  };

  const isBookPurchased = (bookId: string) => {
    return purchasedBooks.some(book => book.id === bookId);
  };

  return (
    <LibraryContext.Provider value={{ purchasedBooks, purchaseBook, isBookPurchased, isLoading }}>
      {children}
    </LibraryContext.Provider>
  );
};