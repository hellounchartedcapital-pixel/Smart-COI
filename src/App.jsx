// App.jsx
// Main app component with authentication routing

import React, { useState } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './Login'
import Signup from './Signup'
import ComplyApp from './ComplyApp'
import { Loader2 } from 'lucide-react'

function AppContent() {
  const { user, loading, signOut } = useAuth()
  const [showSignup, setShowSignup] = useState(false)

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not logged in, show Login or Signup
  if (!user) {
    if (showSignup) {
      return <Signup onSwitchToLogin={() => setShowSignup(false)} />
    }
    return <Login onSwitchToSignup={() => setShowSignup(true)} />
  }

  // User is logged in, show main app
  return <ComplyApp user={user} onSignOut={signOut} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
