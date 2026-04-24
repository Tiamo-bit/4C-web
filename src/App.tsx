import React from 'react';
import { PetOnMap } from './features/pet/PetOnMap';

function App() {
  return (
    <div className="app-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PetOnMap />
    </div>
  );
}

export default App;