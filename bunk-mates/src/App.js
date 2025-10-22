import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from './contexts/UserContext';
import { WeatherProvider } from "./contexts/WeatherContext";
import { ThemeToggleProvider } from './contexts/ThemeToggleContext';
import Home from "./pages/Home";
import Chats from "./pages/Chats";
import Notes from "./pages/Notes";
import Reminders from "./pages/Reminders";
import Trips from "./pages/Trips";
import Search from "./pages/Search";
import './App.css';

function App() {
  return (
    <ThemeToggleProvider>
      <UserProvider>
        <WeatherProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chats" element={<Chats />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/search" element={<Search />} />
            </Routes>
          </Router>
        </WeatherProvider>
      </UserProvider>
    </ThemeToggleProvider>
  );
}

export default App;