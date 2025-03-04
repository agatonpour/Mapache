
import React from "react";
import RaccoonbotLogo from '../../Raccoonbot-Logo.png';

export function Header() {
  return (
    <div className="text-center space-y-2">
      <img src={RaccoonbotLogo} alt="Raccoonbot Logo" className="mx-auto" style={{ width: '250px', height: 'auto' }}/>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Mapache: The Raccoonbot Interface App
      </h1>
      <p className="text-gray-500">
        Environmental monitoring 2.0
      </p>
    </div>
  );
}

