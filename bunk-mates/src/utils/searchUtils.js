import { format } from 'date-fns';

export const filterResultsByType = (results, type) => {
  return results.filter(result => result.type === type);
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return format(date, 'MMMM dd, yyyy');
};

export const searchUsers = (users, query) => {
  return users.filter(user => 
    user.name.toLowerCase().includes(query.toLowerCase()) || 
    user.username.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchNotes = (notes, query) => {
  return notes.filter(note => 
    note.title.toLowerCase().includes(query.toLowerCase()) || 
    note.content.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchReminders = (reminders, query) => {
  return reminders.filter(reminder => 
    reminder.text.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchTrips = (trips, query) => {
  return trips.filter(trip => 
    trip.name.toLowerCase().includes(query.toLowerCase()) || 
    trip.location.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchPlaces = (places, query) => {
  return places.filter(place => 
    place.name.toLowerCase().includes(query.toLowerCase())
  );
};