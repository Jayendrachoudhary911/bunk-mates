import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useUser } from '../contexts/UserContext';
import { useSearch } from '../hooks/useSearch';
import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import SearchFilters from '../components/SearchFilters';

const Chats = () => {
  const { currentUser } = useUser();
  const { searchResults, fetchSearchResults } = useSearch();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ users: true, notes: true, reminders: true, trips: true, places: true });

  useEffect(() => {
    if (currentUser) {
      fetchSearchResults(searchTerm, filters);
    }
  }, [searchTerm, filters, currentUser, fetchSearchResults]);

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Search
      </Typography>
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <SearchFilters filters={filters} setFilters={setFilters} />
      <SearchResults results={searchResults} />
    </Box>
  );
};

export default Chats;