/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TRUST BOUNDARY DECLARATION:
 * Main Application Orchestrator.
 * Handles Firebase Auth state, Google Sign-In popups/redirects, and error boundaries.
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut,
  User 
} from 'firebase/auth';
import { auth, googleProvider } from './firebase/config';
import { UserProfile } from './types';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Shield } from 'lucide-react';
import { recordSignInAuditEvent } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check for redirect result on load
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          const u = result.user;
          setCurrentUser({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
          });
        }
      })
      .catch((err) => {
        console.warn('Redirect auth notice:', err);
      });

    // Listen to continuous auth state
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        // Directive 11: Audit trail sign-in event recording
        recordSignInAuditEvent();
      } else {
        setCurrentUser(null);
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInWithGoogle = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      // Primary: attempt Google sign-in with popup
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const u = result.user;
        setCurrentUser({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
        });
      }
    } catch (err: any) {
      console.warn('Popup sign in encountered issue, attempting redirect flow:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          setAuthError(redirectErr.message || 'Authentication error occurred.');
        }
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Unable to sign in with Google. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Initial Boot Loading Screen
  if (isAuthChecking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f6f2] text-[#3d3d3b]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5A5A40] text-white shadow-sm mb-4 animate-bounce">
          <Shield className="h-6 w-6" />
        </div>
        <div className="font-serif text-xl font-bold text-[#5A5A40]">Sentinel</div>
        <div className="mt-1 text-[11px] uppercase tracking-widest text-[#5D6D5F] font-semibold">Thought Sanctuary</div>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#6b7a6e]">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#d8d5c7] border-t-[#5D6D5F]" />
          <span>Verifying secure sanctuary...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentUser ? (
        <Dashboard user={currentUser} onSignOut={handleSignOut} />
      ) : (
        <LandingPage
          onSignIn={handleSignInWithGoogle}
          isLoading={isSigningIn}
          errorMessage={authError}
        />
      )}
    </>
  );
}
