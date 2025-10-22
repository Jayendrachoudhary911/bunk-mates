import React from 'react';
import { useSearch } from '../hooks/useSearch';
import SearchUserItem from './SearchUserItem';
import SearchPlaceItem from './SearchPlaceItem';
import './Search.css';

const SearchResults = () => {
  const { results, loading, error } = useSearch();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error fetching results: {error.message}</div>;
  }

  return (
    <div className="search-results">
      <h2>Search Results</h2>
      {results.users.length > 0 && (
        <div>
          <h3>Users</h3>
          {results.users.map(user => (
            <SearchUserItem key={user.id} user={user} />
          ))}
        </div>
      )}
      {results.places.length > 0 && (
        <div>
          <h3>Places</h3>
          {results.places.map(place => (
            <SearchPlaceItem key={place.id} place={place} />
          ))}
        </div>
      )}
      {results.notes.length > 0 && (
        <div>
          <h3>Notes</h3>
          {results.notes.map(note => (
            <div key={note.id} className="note-item">
              {note.title}
            </div>
          ))}
        </div>
      )}
      {results.reminders.length > 0 && (
        <div>
          <h3>Reminders</h3>
          {results.reminders.map(reminder => (
            <div key={reminder.id} className="reminder-item">
              {reminder.text}
            </div>
          ))}
        </div>
      )}
      {results.trips.length > 0 && (
        <div>
          <h3>Trips</h3>
          {results.trips.map(trip => (
            <div key={trip.id} className="trip-item">
              {trip.name}
            </div>
          ))}
        </div>
      )}
      {results.users.length === 0 && results.places.length === 0 && results.notes.length === 0 && results.reminders.length === 0 && results.trips.length === 0 && (
        <div className="no-results">No results found.</div>
      )}
    </div>
  );
};

export default SearchResults;