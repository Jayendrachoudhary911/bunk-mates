import React from 'react';
import { Box, Typography } from '@mui/material';

const SearchPlaceItem = ({ place }) => {
  return (
    <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px', margin: '5px 0' }}>
      <Typography variant="h6">{place.name}</Typography>
      <Typography variant="body2">{place.description}</Typography>
      <Typography variant="body2" color="textSecondary">{place.location}</Typography>
    </Box>
  );
};

export default SearchPlaceItem;