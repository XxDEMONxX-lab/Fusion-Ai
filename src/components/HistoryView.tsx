import React, { useState } from 'react';
import { History, Search, Trash2, Download, ArrowUpRight, Edit2, Check, X, FileText, Sparkles } from 'lucide-react';
import { TaskSession } from '../types';
import { StorageService } from '../services/storage';

interface HistoryViewProps {
  history: TaskSession[];
  onReopenSession: (session: TaskSession) => void;
  onRefreshHistory: () => void;
  onNewTask: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onReopenSession,
  onRefreshHistory,
  onNewTask
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(q);
    const taskMatch = item.task.toLowerCase().includes(q);
    const modelMatch = item.modelResults.some(m => m.modelName.toLowerCase().includes(q));
    return titleMatch || taskMatch || modelMatch;
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this task session from history?')) {
      StorageService.deleteTaskSession(id);
      onRefreshHistory();
    }
  };

  const handleStartRename = (session: TaskSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title || session.task.slice(0, 40));
  };

  const handleSaveRename = (session: TaskSession, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      const updated = { ...session, title: editTitle.trim(), updatedAt: new Date().toISOString() };
      StorageService.saveTaskSession(updated);
      onRefreshHistory();
    }
    setEditingId(null);
  };

  const handleExportSession = (session: TaskSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ai-fusion-task-${session.id.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Multi-AI Task History
            </h2>
            <p className="text-xs text-neutral-400">
              {history.length} saved sessions with orchestrated models and combined answers
            </p>
          </div>
        </div>

        <button
          onClick={onNewTask}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search history by task, keyword, or model name..."
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 pl-10 pr-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Sessions List */}
      {filteredHistory.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
          <FileText className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-300">No Previous Tasks Found</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try clearing your search query.' : 'Submit your first task to see multi-model collaborative answers saved here.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onNewTask}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm"
            >
              Start First Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
            const isEditing = editingId === item.id;
            const completedCount = item.modelResults.filter(m => m.status === 'completed').length;
            const totalTokens = (item.modelResults.reduce((acc, m) => acc + (m.tokenUsage?.totalTokens || 0), 0)) +
              (item.synthesisResult?.tokenUsage?.totalTokens || 0);

            return (
              <div
                key={item.id}
                onClick={() => onReopenSession(item)}
                className="group p-4 rounded-xl border border-neutral-800 bg-neutral-900/70 hover:bg-neutral-900 hover:border-neutral-700 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  {/* Title & Date */}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="px-2 py-1 text-xs bg-neutral-950 border border-purple-500 rounded text-white focus:outline-none"
                        />
                        <button
                          onClick={(e) => handleSaveRename(item, e)}
                          className="p-1 text-emerald-400 hover:bg-neutral-800 rounded"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                          className="p-1 text-neutral-400 hover:bg-neutral-800 rounded"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white group-hover:text-purple-300 transition-colors truncate">
                          {item.title || item.task.slice(0, 60)}
                        </span>
                        <button
                          onClick={(e) => handleStartRename(item, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white transition-opacity"
                          title="Rename"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Task Snippet */}
                  <p className="text-xs text-neutral-400 line-clamp-1">
                    {item.task}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 font-mono pt-1">
                    <span>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>·</span>
                    <span className="text-neutral-400">{completedCount} Models Unified</span>
                    <span>·</span>
                    <span className="capitalize">{item.mode} Mode</span>
                    {totalTokens > 0 && (
                      <>
                        <span>·</span>
                        <span>{totalTokens.toLocaleString()} tokens</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleExportSession(item, e)}
                    className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
                    title="Export JSON"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1 text-xs text-purple-400 group-hover:translate-x-0.5 transition-transform pl-2">
                    <span>Reopen</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
