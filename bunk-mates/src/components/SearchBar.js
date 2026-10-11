import React, { useState } from 'react';
import { TextField, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import './Search.css';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (event) => {
    event.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSearch} className="search-bar">
      <TextField
        variant="outlined"
        placeholder="Search for users, notes, reminders, trips, or places..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
      />
      <IconButton type="submit" aria-label="search">
        <SearchIcon />
      </IconButton>
    </form>
  );
};

export default SearchBar;