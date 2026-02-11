import React from 'react';
import PasswordProtection from './PasswordProtection';
import AddressSearch from './AddressSearch';
import './App.css';

function App() {
  return (
    <div className="App">
      <PasswordProtection>
        <AddressSearch />
      </PasswordProtection>
    </div>
  );
}

export default App;
