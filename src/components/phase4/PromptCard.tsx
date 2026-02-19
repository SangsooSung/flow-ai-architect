import { useState } from 'react';
import { Copy, Check, FileDown, Clock, Tag } from 'lucide-react';
import type { PromptCard as PromptCardType } from '@/types/project';

interface PromptCardProps {
  prompt: PromptCardType;
  onCopy: (promptId: string) => void;
  onMarkUsed: (promptId: string) => void;
  onExport: (promptId: string) => void;
  isReady?: boolean; // Dependencies are met
}

export function PromptCard({ prompt, onCopy, onMarkUsed, onExport, isReady = true }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    onCopy(prompt.id);
    setTimeout(() => setCopied(false), 2000);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simple':
        return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'Moderate':
        return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'Complex':
        return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    }
  };

  const getCardBorderColor = () => {
    if (!isReady) return 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/30 dark:bg-yellow-950/20';
    if (prompt.lastUsed) return 'border-blue-400 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/20';
    return 'border-border hover:border-gray-300 dark:hover:border-gray-600';
  };

  return (
    <div className={`border rounded-lg p-4 transition-all ${getCardBorderColor()}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{prompt.title}</h3>
            {prompt.lastUsed && (
              <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{prompt.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded border ${getComplexityColor(prompt.estimatedComplexity)}`}>
            {prompt.estimatedComplexity}
          </span>
          <span className="px-2 py-1 text-xs font-medium rounded bg-muted text-foreground">
            ~{Math.round(prompt.estimatedTokens / 1000)}k tokens
          </span>
        </div>
      </div>

      {/* Dependencies */}
      {prompt.dependencies.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Dependencies:</p>
          <div className="flex flex-wrap gap-1">
            {prompt.dependencies.map((dep) => (
              <span key={dep} className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded">
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {prompt.tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">
            <Tag className="w-3 h-3" />
            {tag}
          </span>
        ))}
      </div>

      {/* Prompt Text (Collapsible) */}
      <div className="mb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-2"
        >
          {expanded ? '▼' : '▶'} {expanded ? 'Hide' : 'Show'} Prompt
        </button>
        {expanded && (
          <div className="bg-muted p-3 rounded border border-border max-h-96 overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">
              {prompt.prompt}
            </pre>
          </div>
        )}
      </div>

      {/* Expected Outputs */}
      <div className="mb-3">
        <p className="text-xs font-medium text-foreground mb-1">Expected Outputs:</p>
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {prompt.expectedOutputs.map((output, idx) => (
            <li key={idx} className="font-mono">• {output}</li>
          ))}
        </ul>
      </div>

      {/* Verification Criteria */}
      <div className="mb-4">
        <p className="text-xs font-medium text-foreground mb-1">Verification Criteria:</p>
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {prompt.verificationCriteria.map((criterion, idx) => (
            <li key={idx}>✓ {criterion}</li>
          ))}
        </ul>
      </div>

      {/* Usage Info */}
      {prompt.lastUsed && (
        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-3">
          <Clock className="w-3 h-3" />
          Used on {new Date(prompt.lastUsed).toLocaleString()}
          {prompt.usageCount && prompt.usageCount > 1 && ` (${prompt.usageCount} times)`}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          disabled={!isReady}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            isReady
              ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Prompt'}
        </button>
        <button
          onClick={() => onExport(prompt.id)}
          disabled={!isReady}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
            isReady
              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 hover:border-green-400 dark:hover:border-green-600'
              : 'border-border bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          <FileDown className="w-4 h-4" />
          Download .txt
        </button>
        <label className="flex items-center gap-1 px-3 py-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!prompt.lastUsed}
            onChange={() => onMarkUsed(prompt.id)}
            disabled={!isReady}
            className="rounded"
          />
          <span className={isReady ? 'text-foreground' : 'text-muted-foreground'}>Mark as Used</span>
        </label>
      </div>

      {!isReady && (
        <div className="mt-3 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded border border-yellow-200 dark:border-yellow-800">
          ⚠️ Dependencies must be completed first
        </div>
      )}
    </div>
  );
}
