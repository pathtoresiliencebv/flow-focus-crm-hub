import { useLoadingState } from '@/contexts/LoadingStateContext';
import { Card } from '@/components/ui/card';

export const LoadingStateDevTools = () => {
  const { state, stateHistory, isLoading } = useLoadingState();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 1000) return `${diff}ms ago`;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    return `${Math.floor(diff / 60000)}m ago`;
  };

  return (
    <Card className="fixed bottom-4 right-4 p-4 max-w-md bg-black/90 text-white text-xs z-50 shadow-xl border-gray-700">
      <div className="font-bold mb-2 text-sm">🔄 Loading State Machine</div>
      
      <div className="mb-2 p-2 bg-gray-800 rounded">
        <span className={isLoading ? 'text-yellow-400' : state.status === 'error' ? 'text-red-400' : 'text-green-400'}>
          {isLoading ? '⏳' : state.status === 'error' ? '❌' : '✅'} <strong>Current:</strong> {state.status}
        </span>
      </div>

      {state.status === 'authenticating' && (
        <div className="mb-2 text-gray-300">
          Cache: {state.hasCache ? '✅ Yes' : '❌ No'}
        </div>
      )}

      {state.status === 'loading-profile' && (
        <div className="mb-2 text-gray-300">
          User ID: {state.userId.slice(0, 8)}...
        </div>
      )}

      {state.status === 'loading-permissions' && (
        <div className="mb-2 text-gray-300">
          User ID: {state.userId.slice(0, 8)}...
        </div>
      )}

      {state.status === 'initializing-data' && (
        <div className="mb-2 text-gray-300">
          Admin: {state.isAdmin ? '✅ Yes' : '❌ No'}
        </div>
      )}

      {state.status === 'loading-section' && (
        <div className="mb-2 text-gray-300">
          Section: <strong>{state.section}</strong>
          {state.operation && ` (${state.operation})`}
        </div>
      )}

      {state.status === 'error' && (
        <div className="mb-2 p-2 bg-red-900/30 rounded">
          <div className="text-red-400 font-bold">Error: {state.error.code}</div>
          <div className="text-red-300 text-xs mt-1">{state.error.message}</div>
          <div className="text-gray-400 text-xs mt-1">
            Previous: {state.previousState}
          </div>
          <div className="text-gray-400 text-xs">
            Retry: {state.error.canRetry ? '✅' : '❌'}
          </div>
        </div>
      )}

      {state.status === 'ready' && (
        <div className="mb-2 p-2 bg-green-900/30 rounded">
          <div className="text-green-400">User: {state.user.email}</div>
          <div className="text-gray-300 text-xs">Role: {state.user.role}</div>
          <div className="text-gray-300 text-xs">Admin: {state.user.isAdmin ? '✅' : '❌'}</div>
        </div>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer text-gray-400 hover:text-white">
          History ({stateHistory.length} transitions)
        </summary>
        <div className="mt-2 max-h-40 overflow-y-auto bg-gray-900/50 rounded p-2">
          {stateHistory.length === 0 ? (
            <div className="text-gray-500 text-xs">No history yet</div>
          ) : (
            stateHistory.slice().reverse().map((entry, i) => (
              <div key={i} className="text-gray-400 text-xs py-1 border-b border-gray-800 last:border-0">
                <span className="text-gray-500">{stateHistory.length - i}.</span>{' '}
                <span className="text-white">{entry.status}</span>{' '}
                <span className="text-gray-600">({formatTimestamp(entry.timestamp)})</span>
              </div>
            ))
          )}
        </div>
      </details>
    </Card>
  );
};

