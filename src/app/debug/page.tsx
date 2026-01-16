'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DebugPage() {
  const [status, setStatus] = useState<any>({ loading: true });
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Obter variáveis de ambiente (seguras)
        const env = {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'DEFINED (Masked)' : 'UNDEFINED',
          NODE_ENV: process.env.NODE_ENV,
        };
        setEnvVars(env);

        // Testar conexão Supabase
        const start = performance.now();
        const { data, error } = await supabase.auth.getSession();
        const end = performance.now();

        if (error) throw error;

        setStatus({
          success: true,
          latency: Math.round(end - start) + 'ms',
          session: data.session ? 'Active' : 'None',
          user: data.session?.user?.email || 'N/A'
        });

      } catch (err: any) {
        setStatus({
          success: false,
          error: err.message || JSON.stringify(err)
        });
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto bg-white text-black min-h-screen">
      <h1 className="text-3xl font-bold border-b pb-4">System Debug</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Environment Variables</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Supabase Connection Status</h2>
        <div className={`p-4 rounded border ${status.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {status.loading ? (
            'Testing connection...'
          ) : (
            <pre className="text-sm overflow-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
