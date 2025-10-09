// Web-safe placeholder for Receipts
// This project uses Capacitor, not Expo/React Native
// Mobile functionality should be implemented using @capacitor APIs

import React from 'react';

export default function ReceiptsScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '20px'
      }}>
        📄
      </div>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '12px',
        textAlign: 'center'
      }}>
        Bonnetjes Beheer
      </h2>
      <p style={{
        fontSize: '16px',
        color: '#6b7280',
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: '1.5'
      }}>
        Bonnetjes functionaliteit is beschikbaar via de hoofd web interface.
        Gebruik het Bonnetjes menu item in de sidebar.
      </p>
    </div>
  );
}
