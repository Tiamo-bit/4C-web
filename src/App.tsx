import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import PuzzlePage from './pages/PuzzlePage';
import LearnPage from './pages/LearnPage';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/learn/:id" element={<LearnPage />} />
        <Route path="/puzzle/:id" element={<PuzzlePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
