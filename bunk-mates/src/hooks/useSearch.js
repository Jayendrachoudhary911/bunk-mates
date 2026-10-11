import { useState, useEffect } from 'react';
import { fetchUsers, fetchNotes, fetchReminders, fetchTrips, fetchPlaces } from '../api/search';

const useSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    users: [],
    notes: [],
    reminders: [],
    trips: [],
    places: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (searchQuery) => {
    setLoading(true);
    setQuery(searchQuery);
    setError(null);

    try {
      const [users, notes, reminders, trips, places] = await Promise.all([
        fetchUsers(searchQuery),
        fetchNotes(searchQuery),
        fetchReminders(searchQuery),
        fetchTrips(searchQuery),
        fetchPlaces(searchQuery),
      ]);

      setResults({
        users,
        notes,
        reminders,
        trips,
        places,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      handleSearch(query);
    } else {
      setResults({
        users: [],
        notes: [],
        reminders: [],
        trips: [],
        places: [],
      });
    }
  }, [query]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    handleSearch,
  };
};

export default useSearch;