import React from 'react';
import { Sparkles, Key, History, LayoutDashboard, PlusCircle, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'new-task' | 'history';
  setActiveTab: (tab: 'dashboard' | 'new-task' | 'history') => void;
  isConnected: boolean;
  keyLabel?: string;
  onOpenKeyModal: () => void;
  onNewTaskClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isConnected,
  keyLabel,
  onOpenKeyModal,
  onNewTaskClick
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-sm shadow-purple-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                AI Fusion Hub
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-neutral-900/70 border border-neutral-800 rounded-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </button>

          <button
            onClick={() => {
              onNewTaskClick();
              setActiveTab('new-task');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              activeTab === 'new-task'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Task Workspace
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            History
          </button>
        </nav>

        {/* Zone 3: Actions & Key Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenKeyModal}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
              isConnected
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40'
                : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
            }`}
            title="OpenRouter API Key Status"
          >
            {isConnected ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Connected:</span>
                <span className="truncate max-w-[120px] font-mono text-[11px] text-emerald-200">
                  {keyLabel || 'OpenRouter'}
                </span>
              </>
            ) : (
              <>
                <Key className="h-3.5 w-3.5 text-amber-400" />
                <span>Connect Key</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              onNewTaskClick();
              setActiveTab('new-task');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm shadow-purple-600/30 transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};
