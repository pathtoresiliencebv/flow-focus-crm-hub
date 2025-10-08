import React from 'react';
import { MonteurDashboard } from '@/components/monteur/MonteurDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function MonteurDashboardPage() {
  const { user, hasPermission } = useAuth();

  // Redirect if not logged in or not a monteur
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user is monteur (not administrator)
  const isAdmin = hasPermission('users_view');
  if (isAdmin) {
    // Administrators should use the normal dashboard
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Monteur Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Overzicht van je planning en projecten
            </p>
          </div>
        </div>

        {/* Main Content */}
        <MonteurDashboard />
      </div>
    </div>
  );
}

