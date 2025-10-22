# BunkMate

BunkMate is a comprehensive application designed to help users manage their social interactions, notes, reminders, trips, and more. This project provides a user-friendly interface for searching and organizing various aspects of daily life.

## Features

- **User Management**: Easily manage friends and connections.
- **Notes**: Create, edit, and view notes for personal or collaborative use.
- **Reminders**: Set reminders for important tasks and events.
- **Trips**: Organize and manage trips, including itineraries and member contributions.
- **Search Functionality**: Universal search for users, friends, notes, reminders, trips, and new places.

## Project Structure

```
bunk-mates
├── src
│   ├── App.js
│   ├── index.js
│   ├── pages
│   │   ├── Home.js
│   │   ├── Chats.js
│   │   ├── Notes.js
│   │   ├── Reminders.js
│   │   ├── Trips.js
│   │   └── Search.js
│   ├── components
│   │   ├── SearchBar.js
│   │   ├── SearchResults.js
│   │   ├── SearchFilters.js
│   │   ├── SearchPlaceItem.js
│   │   └── SearchUserItem.js
│   ├── contexts
│   │   ├── UserContext.js
│   │   ├── WeatherContext.js
│   │   └── SearchContext.js
│   ├── hooks
│   │   └── useSearch.js
│   ├── api
│   │   └── search.js
│   ├── utils
│   │   └── searchUtils.js
│   ├── styles
│   │   └── Search.css
│   └── tests
│       └── Search.test.js
├── public
│   └── index.html
├── package.json
├── .env
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd bunk-mates
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run:
```
npm start
```
This will launch the app in your default web browser.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.