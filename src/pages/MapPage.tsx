import React from 'react';
import { PetOnMap } from '../features/pet/PetOnMap';
import { useNavigate } from 'react-router-dom';

export default function MapPage() {
  const navigate = useNavigate();
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '64px', boxSizing: 'border-box', background: '#F4ECDF' }}>
      <PetOnMap onProvinceEnter={(id) => navigate('/learn/' + id)} />
    </div>
  );
}
