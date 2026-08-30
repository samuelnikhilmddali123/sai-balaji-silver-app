import React, { createContext, useContext, useState } from 'react';

interface SearchContextType {
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const SearchContext = createContext<SearchContextType>({
  isSearchOpen: false,
  openSearch: () => {},
  closeSearch: () => {},
});

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <SearchContext.Provider
      value={{
        isSearchOpen,
        openSearch: () => setIsSearchOpen(true),
        closeSearch: () => setIsSearchOpen(false),
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchModal = () => useContext(SearchContext);
