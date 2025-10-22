import React from 'react';
import { FormControl, FormGroup, FormControlLabel, Checkbox } from '@mui/material';

const SearchFilters = ({ filters, setFilters }) => {
  const handleChange = (event) => {
    const { name, checked } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: checked,
    }));
  };

  return (
    <FormControl component="fieldset">
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.users}
              onChange={handleChange}
              name="users"
            />
          }
          label="Users"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.friends}
              onChange={handleChange}
              name="friends"
            />
          }
          label="Friends"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.notes}
              onChange={handleChange}
              name="notes"
            />
          }
          label="Notes"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.reminders}
              onChange={handleChange}
              name="reminders"
            />
          }
          label="Reminders"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.trips}
              onChange={handleChange}
              name="trips"
            />
          }
          label="Trips"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.places}
              onChange={handleChange}
              name="places"
            />
          }
          label="New Places"
        />
      </FormGroup>
    </FormControl>
  );
};

export default SearchFilters;