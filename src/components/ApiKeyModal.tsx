import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, Trash2, ExternalLink } from 'lucide-react';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { KeyVerificationResponse } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyStatusChange: (connected: boolean, label?: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyStatusChange
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [persistLocally, setPersistLocally] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connected' | 'invalid' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [keyDetails, setKeyDetails] = useState<KeyVerificationResponse | null>(null);
  const [hasSavedKey, setHasSavedKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = StorageService.getApiKey();
      if (existing) {
        setHasSavedKey(true);
        // Mask key for privacy
        setApiKeyInput(existing);
        setPersistLocally(StorageService.isKeyPersistedLocally());
        setStatus('connected');
      } else {
        setHasSavedKey(false);
        setApiKeyInput('');
        setStatus('idle');
        setKeyDetails(null);
      }
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setErrorMessage('Please enter an OpenRouter API key.');
      setStatus('invalid');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await ApiService.testKey(trimmed);
      if (res.valid) {
        setStatus('connected');
        setKeyDetails(res);
        StorageService.setApiKey(trimmed, persistLocally);
        setHasSavedKey(true);
        onKeyStatusChange(true, res.label || 'Connected');
      } else {
        setStatus('invalid');
        setErrorMessage(res.error || 'The API key provided could not be verified by OpenRouter.');
        onKeyStatusChange(false);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Error communicating with verification service.');
      onKeyStatusChange(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemoveKey = () => {
    StorageService.removeApiKey();
    setApiKeyInput('');
    setHasSavedKey(false);
    setStatus('idle');
    setKeyDetails(null);
    setErrorMessage(null);
    onKeyStatusChange(false);
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 10) return '••••••••••';
    return `${key.slice(0, 6)}••••••••••••${key.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl relative text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/70 border border-purple-800/60 text-purple-400">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">
                OpenRouter API Connection
              </h3>
              <p className="text-xs text-neutral-400">
                Securely authenticate to query multi-model endpoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          {/* Key Input */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              OpenRouter API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setStatus('idle');
                  setErrorMessage(null);
                }}
                placeholder="sk-or-v1-..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 pr-10 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Persist checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="persistKey"
              checked={persistLocally}
              onChange={(e) => setPersistLocally(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-purple-600 focus:ring-purple-500/20"
            />
            <label htmlFor="persistKey" className="text-xs text-neutral-400 cursor-pointer">
              Remember key in this browser across tabs and sessions
            </label>
          </div>

          {/* Status Display */}
          {status === 'connected' && (
            <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-3 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-emerald-300">
                  Connection Verified: Active
                </div>
                {keyDetails?.label && (
                  <div className="text-emerald-400/90 mt-0.5">
                    Account: <span className="font-mono text-neutral-200">{keyDetails.label}</span>
                  </div>
                )}
                {keyDetails?.usage !== undefined && (
                  <div className="text-neutral-400 mt-1 flex items-center gap-2">
                    <span>Usage: ${keyDetails.usage?.toFixed(4) || '0.00'}</span>
                    {keyDetails?.limit ? (
                      <span>· Limit: ${keyDetails.limit?.toFixed(2)}</span>
                    ) : (
                      <span>· No hard limit</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'invalid' && (
            <div className="rounded-lg border border-rose-900/60 bg-rose-950/30 p-3 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-rose-300">Connection Failed</div>
                <div className="text-rose-400/90 mt-0.5">{errorMessage || 'Invalid API Key'}</div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-3 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-amber-300">Network / Service Error</div>
                <div className="text-amber-400/90 mt-0.5">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs text-neutral-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
              <span>Zero-Storage Security Policy</span>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              Your API key is never exposed publicly or logged on our servers. All completions are securely proxied. Use your own OpenRouter API key. Model availability, limits, and costs depend on your OpenRouter account and selected models.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-400 hover:text-purple-400 flex items-center gap-1 transition-colors"
            >
              <span>Get an OpenRouter key</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            {hasSavedKey && (
              <button
                type="button"
                onClick={handleRemoveKey}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Disconnect Key</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleTestAndSave}
            disabled={isVerifying || !apiKeyInput.trim()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-purple-600/30 transition-all"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Testing Connection...</span>
              </>
            ) : (
              <span>Save & Connect</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
