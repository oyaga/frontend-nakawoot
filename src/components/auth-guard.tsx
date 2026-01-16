'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const [showSlowLoading, setShowSlowLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const isAuthCheckComplete = useAuthStore((state) => state.isAuthCheckComplete);
  const router = useRouter();

  useEffect(() => {
    // Timeout de segurança: se travar por 5 segundos, mostra botão de ação
    const timer = setTimeout(() => {
      setShowSlowLoading(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      // DEBUG LOGS
      console.log('[AuthGuard] Checking auth state:', { 
        hasHydrated, 
        isAuthCheckComplete, 
        hasUser: !!user, 
        hasSession: !!session 
      });

      // Wait for both hydration and auth check to complete
      if (hasHydrated && isAuthCheckComplete) {
        // Check if user or session exists
        const isAuthenticated = !!(user || session);

        if (!isAuthenticated) {
          console.log('[AuthGuard] Not authenticated, redirecting to login');
          // Redirect to login if not authenticated
          router.push('/login');
        } else {
          console.log('[AuthGuard] Authenticated, rendering content');
          // Authenticated, stop checking
          setIsChecking(false);
        }
      }
    };

    checkAuth();
  }, [user, session, hasHydrated, isAuthCheckComplete, router]);

  // Force logout helper
  const handleForceLogout = () => {
    localStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.href = '/login';
  };

  // Show loader while checking authentication status
  if (isChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-blue-500" />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Verificando autenticação...</p>
            {showSlowLoading && (
              <div className="animate-in fade-in duration-500 flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground">Está demorando mais que o esperado.</p>
                <Button variant="outline" size="sm" onClick={handleForceLogout}>
                  Reiniciar Sessão
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If we get here, the user is authenticated
  return <>{children}</>;
}