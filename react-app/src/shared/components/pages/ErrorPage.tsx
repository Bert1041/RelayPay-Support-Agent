import React from 'react';
import { RefreshCcw, Home, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface ErrorPageProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex flex-col items-center justify-center p-6 text-center">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 max-w-md w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <AlertCircle className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
        </div>

        <h1 className="text-heading-lg text-white mb-4">
          Oops! Something went wrong
        </h1>
        
        <p className="text-body-md text-neutral-400 mb-8 leading-relaxed">
          Roxanne encountered an unexpected issue. Don't worry, your data is safe. Let's try to get back on track.
        </p>

        {error && (
          <div className="mb-8 p-3 bg-black/40 border border-white/5 rounded-xl text-left overflow-hidden">
            <p className="text-caption font-mono text-red-400/80 break-all line-clamp-2">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {resetErrorBoundary ? (
            <Button 
              onClick={resetErrorBoundary}
              className="w-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 group h-12 text-lg font-medium"
            >
              <RefreshCcw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              Try Again
            </Button>
          ) : (
            <Button 
              onClick={() => window.location.reload()}
              className="w-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 group h-12 text-lg font-medium"
            >
              <RefreshCcw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              Reload Application
            </Button>
          )}
          
          <Button 
            onClick={() => window.location.href = '/'}
            variant="ghost" 
            className="w-full text-neutral-400 hover:text-white hover:bg-white/5 h-12"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>

      <p className="mt-8 text-caption text-neutral-600 font-medium tracking-widest uppercase">
        Powered by Roxanne Intelligence
      </p>
    </div>
  );
};

export default ErrorPage;
