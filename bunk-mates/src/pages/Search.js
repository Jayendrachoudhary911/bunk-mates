import React, { useState, useEffect, useContext } from 'react';
import { SearchContext } from '../contexts/SearchContext';
import SearchBar from '../components/SearchBar';
import SearchFilters from '../components/SearchFilters';
import SearchResults from '../components/SearchResults';
import './Search.css';

const Search = () => {
  const { searchResults, fetchSearchResults } = useContext(SearchContext);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ users: true, notes: true, reminders: true, trips: true, places: true });

  useEffect(() => {
    if (query) {
      fetchSearchResults(query, filters);
    }
  }, [query, filters, fetchSearchResults]);

  return (
    <div className="search-page">
      <h1>Search</h1>
      <SearchBar query={query} setQuery={setQuery} />
      <SearchFilters filters={filters} setFilters={setFilters} />
      <SearchResults results={searchResults} />
    </div>
  );
};

export default Search;