import React, { createContext, useState, useContext } from 'react';
import { fetchSearchResults } from '../api/search';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performSearch = async (term) => {
    setLoading(true);
    setError(null);
    setSearchTerm(term);

    try {
      const data = await fetchSearchResults(term);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SearchContext.Provider value={{ searchTerm, results, loading, error, performSearch }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  return useContext(SearchContext);
};