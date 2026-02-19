import { useState } from 'react';
import { Settings, RefreshCw, X } from 'lucide-react';
import type { TechStackConfig } from '@/types/project';

interface TechStackSelectorProps {
  currentStack: TechStackConfig;
  onChange: (stack: TechStackConfig) => void;
  onRegenerate: () => void;
  hasExistingPrompts?: boolean;
}

export function TechStackSelector({ currentStack, onChange, onRegenerate, hasExistingPrompts = false }: TechStackSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tempStack, setTempStack] = useState<TechStackConfig>(currentStack);

  const handleSave = () => {
    onChange(tempStack);
    setIsOpen(false);
    if (hasExistingPrompts) {
      setShowConfirmation(true);
    } else {
      onRegenerate();
    }
  };

  const handleConfirmRegenerate = () => {
    setShowConfirmation(false);
    onRegenerate();
  };

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted/60 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configure Tech Stack
        </button>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-2">Regenerate Prompts?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Changing the tech stack will regenerate all implementation prompts. Your current prompts and usage tracking will be replaced.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded hover:bg-muted/60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRegenerate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  <RefreshCw className="w-4 h-4 inline mr-1" />
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Technology Stack Configuration</h3>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Backend */}
          <div>
            <h4 className="font-medium text-sm text-foreground mb-3">Backend</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Framework</label>
                <select
                  value={tempStack.backend.framework}
                  onChange={(e) => setTempStack({
                    ...tempStack,
                    backend: { ...tempStack.backend, framework: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 text-sm bg-card text-foreground border border-border rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <option value="Node.js + Express">Node.js + Express</option>
                  <option value="Django">Django</option>
                  <option value="FastAPI">FastAPI</option>
                  <option value="ASP.NET Core">ASP.NET Core</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Database</label>
                <select
                  value={tempStack.backend.database}
                  onChange={(e) => setTempStack({
                    ...tempStack,
                    backend: { ...tempStack.backend, database: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 text-sm bg-card text-foreground border border-border rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <option value="PostgreSQL">PostgreSQL</option>
                  <option value="MySQL">MySQL</option>
                  <option value="MongoDB">MongoDB</option>
                  <option value="SQL Server">SQL Server</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">ORM</label>
                <select
                  value={tempStack.backend.orm}
                  onChange={(e) => setTempStack({
                    ...tempStack,
                    backend: { ...tempStack.backend, orm: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 text-sm bg-card text-foreground border border-border rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <option value="Prisma">Prisma</option>
                  <option value="TypeORM">TypeORM</option>
                  <option value="SQLAlchemy">SQLAlchemy</option>
                  <option value="Entity Framework">Entity Framework</option>
                </select>
              </div>
            </div>
          </div>

          {/* Frontend */}
          <div>
            <h4 className="font-medium text-sm text-foreground mb-3">Frontend</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Framework</label>
                <select
                  value={tempStack.frontend.framework}
                  onChange={(e) => setTempStack({
                    ...tempStack,
                    frontend: { ...tempStack.frontend, framework: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 text-sm bg-card text-foreground border border-border rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <option value="React">React</option>
                  <option value="Vue">Vue</option>
                  <option value="Angular">Angular</option>
                  <option value="Svelte">Svelte</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">State Management</label>
                <select
                  value={tempStack.frontend.stateManagement}
                  onChange={(e) => setTempStack({
                    ...tempStack,
                    frontend: { ...tempStack.frontend, stateManagement: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 text-sm bg-card text-foreground border border-border rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <option value="Redux">Redux</option>
                  <option value="Zustand">Zustand</option>
                  <option value="Pinia">Pinia</option>
                  <option value="Context API">Context API</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">UI Library</label>
                <select
                  value={tempStack.frontend.uiLibrary}
                  onChange={(e) => setTempStack({
                    ...tempStack,
                    frontend: { ...tempStack.frontend, uiLibrary: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 text-sm bg-card text-foreground border border-border rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <option value="Material-UI">Material-UI</option>
                  <option value="Ant Design">Ant Design</option>
                  <option value="Chakra UI">Chakra UI</option>
                  <option value="Tailwind + shadcn">Tailwind + shadcn</option>
                </select>
              </div>
            </div>
          </div>

          {/* Deployment */}
          <div>
            <h4 className="font-medium text-sm text-foreground mb-3">Deployment</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Platform</label>
                <select
                  value={tempStack.deployment.platform}
                  onChange={(e) => setTempStack({
                    ...tempStack,
                    deployment: { ...tempStack.deployment, platform: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 text-sm bg-card text-foreground border border-border rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <option value="AWS">AWS</option>
                  <option value="Azure">Azure</option>
                  <option value="GCP">GCP</option>
                  <option value="Vercel">Vercel</option>
                  <option value="Docker">Docker</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Authentication</label>
                <select
                  value={tempStack.deployment.authentication}
                  onChange={(e) => setTempStack({
                    ...tempStack,
                    deployment: { ...tempStack.deployment, authentication: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 text-sm bg-card text-foreground border border-border rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <option value="JWT">JWT</option>
                  <option value="OAuth2">OAuth2</option>
                  <option value="Auth0">Auth0</option>
                  <option value="Supabase Auth">Supabase Auth</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded hover:bg-muted/60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Save & {hasExistingPrompts ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
