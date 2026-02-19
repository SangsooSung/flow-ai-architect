import { useState } from 'react';
import { Database, Server, Monitor, Link2, TestTube2, Download, Clock } from 'lucide-react';
import type { Phase4Data, TechStackConfig } from '@/types/project';
import { PromptCard } from './phase4/PromptCard';
import { TechStackSelector } from './phase4/TechStackSelector';
import { toast } from 'sonner';

interface Phase4PanelProps {
  data: Phase4Data;
  onTechStackChange?: (stack: TechStackConfig) => void;
  onRegenerate?: () => void;
}

type TabType = 'overview' | 'database' | 'backend' | 'frontend' | 'integration' | 'testing';

export function Phase4Panel({ data, onTechStackChange, onRegenerate }: Phase4PanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [usedPrompts, setUsedPrompts] = useState<Record<string, { lastUsed: string; count: number }>>(() => {
    try {
      const allPrompts = getAllPrompts(data);
      return Object.fromEntries(
        allPrompts.filter(p => p && p.lastUsed).map(p => [p.id, { lastUsed: p.lastUsed!, count: p.usageCount || 1 }])
      );
    } catch (error) {
      console.error('Error initializing used prompts:', error);
      return {};
    }
  });

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Clock },
    { id: 'database' as TabType, label: 'Database', icon: Database },
    { id: 'backend' as TabType, label: 'Backend', icon: Server },
    { id: 'frontend' as TabType, label: 'Frontend', icon: Monitor },
    { id: 'integration' as TabType, label: 'Integration', icon: Link2 },
    { id: 'testing' as TabType, label: 'Testing', icon: TestTube2 },
  ];

  const handleCopy = (promptId: string) => {
    toast.success('Prompt copied to clipboard!');
  };

  const handleMarkUsed = (promptId: string) => {
    if (usedPrompts[promptId]) {
      // Remove mark
      const newUsed = { ...usedPrompts };
      delete newUsed[promptId];
      setUsedPrompts(newUsed);
      toast.info('Prompt unmarked');
    } else {
      // Add mark
      setUsedPrompts({
        ...usedPrompts,
        [promptId]: {
          lastUsed: new Date().toISOString(),
          count: 1,
        },
      });
      toast.success('Prompt marked as used!');
    }
  };

  const handleExport = (promptId: string) => {
    const prompt = getAllPrompts(data).find(p => p?.id === promptId);
    if (!prompt) {
      toast.error('Prompt not found');
      return;
    }

    // Create formatted content with metadata
    const content = `# ${prompt.title || 'Untitled Prompt'}

**Complexity:** ${prompt.estimatedComplexity || 'N/A'}
**Estimated Tokens:** ~${Math.round((prompt.estimatedTokens || 0) / 1000)}k
**Tags:** ${Array.isArray(prompt.tags) ? prompt.tags.join(', ') : 'N/A'}

${Array.isArray(prompt.dependencies) && prompt.dependencies.length > 0 ? `**Dependencies:**\n${prompt.dependencies.map(d => `- ${d}`).join('\n')}\n` : ''}
## Expected Outputs

${Array.isArray(prompt.expectedOutputs) ? prompt.expectedOutputs.map(o => `- ${o}`).join('\n') : 'None specified'}

## Verification Criteria

${Array.isArray(prompt.verificationCriteria) ? prompt.verificationCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n') : 'None specified'}

---

## IMPLEMENTATION PROMPT

${prompt.prompt || 'No prompt content available'}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${promptId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Prompt exported!');
  };

  const handleExportAll = () => {
    const allPrompts = getAllPrompts(data);

    if (allPrompts.length === 0) {
      toast.error('No prompts available to export');
      return;
    }

    const metadata = data?.metadata || {};
    const techStack = data?.techStack || {};
    const backend = techStack.backend || {};
    const frontend = techStack.frontend || {};
    const deployment = techStack.deployment || {};

    // Create a master document with all prompts
    const masterContent = `# ERP Implementation Prompts
Generated: ${data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : 'N/A'}

## Technology Stack

**Backend:**
- Framework: ${backend.framework || 'N/A'}
- Database: ${backend.database || 'N/A'}
- ORM: ${backend.orm || 'N/A'}

**Frontend:**
- Framework: ${frontend.framework || 'N/A'}
- State Management: ${frontend.stateManagement || 'N/A'}
- UI Library: ${frontend.uiLibrary || 'N/A'}

**Deployment:**
- Platform: ${deployment.platform || 'N/A'}
- Authentication: ${deployment.authentication || 'N/A'}

## Summary

- **Total Prompts:** ${metadata.totalPrompts || allPrompts.length}
- **Estimated Time:** ${metadata.estimatedImplementationTime || 'N/A'}
- **Critical Path:** ${(metadata.criticalPathPrompts || []).join(', ') || 'N/A'}

## Implementation Order

${(metadata.implementationOrder || []).map((id, i) => {
  const isCritical = (metadata.criticalPathPrompts || []).includes(id);
  return `${i + 1}. ${id}${isCritical ? ' ⚠️ CRITICAL' : ''}`;
}).join('\n') || 'No implementation order defined'}

---

${allPrompts.map((prompt, idx) => {
  if (!prompt) return '';
  return `
# ${idx + 1}. ${prompt.title || 'Untitled Prompt'}

**ID:** ${prompt.id || 'N/A'}
**Complexity:** ${prompt.estimatedComplexity || 'N/A'} | **Tokens:** ~${Math.round((prompt.estimatedTokens || 0) / 1000)}k
**Tags:** ${Array.isArray(prompt.tags) ? prompt.tags.join(', ') : 'N/A'}
${Array.isArray(prompt.dependencies) && prompt.dependencies.length > 0 ? `**Dependencies:** ${prompt.dependencies.join(', ')}` : ''}

## Expected Outputs
${Array.isArray(prompt.expectedOutputs) ? prompt.expectedOutputs.map(o => `- ${o}`).join('\n') : 'None specified'}

## Verification Criteria
${Array.isArray(prompt.verificationCriteria) ? prompt.verificationCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n') : 'None specified'}

## Prompt

${prompt.prompt || 'No prompt content available'}

---
`;
}).filter(Boolean).join('\n')}

## How to Use These Prompts

1. Follow the implementation order listed above
2. For each prompt:
   - Copy the prompt text
   - Paste into Claude, ChatGPT, or Cursor
   - Review and implement the generated code
   - Run the verification criteria
   - Mark as complete before moving to dependent prompts
3. Critical path prompts (marked with ⚠️) are essential for the system to function

## Support

Generated by Flow AI Architect - Phase 4
For issues or questions, refer to your Phase 3 PRD for context.
`;

    // Download master file
    const blob = new Blob([masterContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'implementation-prompts-complete.md';
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Downloaded complete implementation guide with ${allPrompts.length} prompts!`);
  };

  const isPromptReady = (promptId: string, dependencies: string[]) => {
    return dependencies.every(dep => usedPrompts[dep]);
  };

  const allPrompts = getAllPrompts(data);
  const completedCount = Object.keys(usedPrompts).length;
  const totalCount = allPrompts.length;

  // Safety check for metadata
  const techStack = data?.techStack || {
    backend: { framework: 'N/A', database: 'N/A', orm: 'N/A' },
    frontend: { framework: 'N/A', stateManagement: 'N/A', uiLibrary: 'N/A' },
    deployment: { platform: 'N/A', authentication: 'N/A' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Phase 4: Implementation Prompts</h2>
            <p className="text-muted-foreground mt-1">
              Copy-paste ready AI prompts for building your ERP system
            </p>
          </div>
          <div className="flex gap-2">
            <TechStackSelector
              currentStack={techStack}
              onChange={onTechStackChange || (() => {})}
              onRegenerate={onRegenerate || (() => {})}
              hasExistingPrompts={totalCount > 0}
            />
            <button
              onClick={handleExportAll}
              disabled={totalCount === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download All Prompts
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-foreground">Progress</span>
            <span className="text-muted-foreground">{completedCount} of {totalCount} prompts completed</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Tech Stack Summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-foreground mb-1">Backend</p>
            <p className="text-muted-foreground">{techStack.backend.framework}</p>
            <p className="text-muted-foreground">{techStack.backend.database}</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Frontend</p>
            <p className="text-muted-foreground">{techStack.frontend.framework}</p>
            <p className="text-muted-foreground">{techStack.frontend.uiLibrary}</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Deployment</p>
            <p className="text-muted-foreground">{techStack.deployment.platform}</p>
            <p className="text-muted-foreground">{techStack.deployment.authentication}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab data={data} completedCount={completedCount} totalCount={allPrompts.length} />
        )}
        {activeTab === 'database' && data.prompts.database && (
          <DatabaseTab
            prompts={data.prompts.database}
            usedPrompts={usedPrompts}
            onCopy={handleCopy}
            onMarkUsed={handleMarkUsed}
            onExport={handleExport}
            isPromptReady={isPromptReady}
          />
        )}
        {activeTab === 'backend' && data.prompts.backend && (
          <ModuleTab
            modules={data.prompts.backend}
            usedPrompts={usedPrompts}
            onCopy={handleCopy}
            onMarkUsed={handleMarkUsed}
            onExport={handleExport}
            isPromptReady={isPromptReady}
          />
        )}
        {activeTab === 'frontend' && data.prompts.frontend && (
          <ModuleTab
            modules={data.prompts.frontend}
            usedPrompts={usedPrompts}
            onCopy={handleCopy}
            onMarkUsed={handleMarkUsed}
            onExport={handleExport}
            isPromptReady={isPromptReady}
          />
        )}
        {activeTab === 'integration' && data.prompts.integration && (
          <IntegrationTab
            prompts={data.prompts.integration}
            usedPrompts={usedPrompts}
            onCopy={handleCopy}
            onMarkUsed={handleMarkUsed}
            onExport={handleExport}
            isPromptReady={isPromptReady}
          />
        )}
        {activeTab === 'testing' && data.prompts.testing && (
          <TestingTab
            prompts={data.prompts.testing}
            usedPrompts={usedPrompts}
            onCopy={handleCopy}
            onMarkUsed={handleMarkUsed}
            onExport={handleExport}
            isPromptReady={isPromptReady}
          />
        )}
      </div>
    </div>
  );
}

// Helper Components

function OverviewTab({ data, completedCount, totalCount }: { data: Phase4Data; completedCount: number; totalCount: number }) {
  const metadata = data?.metadata || {};
  const implementationOrder = metadata.implementationOrder || [];
  const criticalPathPrompts = metadata.criticalPathPrompts || [];
  const estimatedTime = metadata.estimatedImplementationTime || 'N/A';

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Implementation Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{totalCount}</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">Total Prompts</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <p className="text-2xl font-bold text-green-900 dark:text-green-300">{completedCount}</p>
            <p className="text-sm text-green-700 dark:text-green-300">Completed</p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{totalCount - completedCount}</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Remaining</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-300">{estimatedTime}</p>
            <p className="text-sm text-purple-700 dark:text-purple-300">Est. Time</p>
          </div>
        </div>
      </div>

      {implementationOrder.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Implementation Order</h3>
          <div className="space-y-2">
            {implementationOrder.map((promptId, idx) => {
              const isCritical = criticalPathPrompts.includes(promptId);
              return (
                <div
                  key={promptId || idx}
                  className={`flex items-center gap-3 p-3 rounded ${
                    isCritical ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800' : 'bg-muted'
                  }`}
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-700 text-white text-xs font-medium">
                    {idx + 1}
                  </span>
                  <span className="font-mono text-sm">{promptId}</span>
                  {isCritical && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded">
                      Critical Path
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DatabaseTab({
  prompts,
  usedPrompts,
  onCopy,
  onMarkUsed,
  onExport,
  isPromptReady,
}: any) {
  if (!prompts) {
    return (
      <div className="bg-muted rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">No database prompts available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prompts.schemaDefinition && (
        <PromptCard
          prompt={{ ...prompts.schemaDefinition, lastUsed: usedPrompts[prompts.schemaDefinition.id]?.lastUsed }}
          onCopy={onCopy}
          onMarkUsed={onMarkUsed}
          onExport={onExport}
          isReady={isPromptReady(prompts.schemaDefinition.id, prompts.schemaDefinition.dependencies)}
        />
      )}
      {prompts.migrations && (
        <PromptCard
          prompt={{ ...prompts.migrations, lastUsed: usedPrompts[prompts.migrations.id]?.lastUsed }}
          onCopy={onCopy}
          onMarkUsed={onMarkUsed}
          onExport={onExport}
          isReady={isPromptReady(prompts.migrations.id, prompts.migrations.dependencies)}
        />
      )}
      {prompts.seedData && (
        <PromptCard
          prompt={{ ...prompts.seedData, lastUsed: usedPrompts[prompts.seedData.id]?.lastUsed }}
          onCopy={onCopy}
          onMarkUsed={onMarkUsed}
          onExport={onExport}
          isReady={isPromptReady(prompts.seedData.id, prompts.seedData.dependencies)}
        />
      )}
    </div>
  );
}

function ModuleTab({ modules, usedPrompts, onCopy, onMarkUsed, onExport, isPromptReady }: any) {
  if (!modules || !Array.isArray(modules) || modules.length === 0) {
    return (
      <div className="bg-muted rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">No module prompts generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {modules.map((module: any) => (
        <div key={module?.moduleName || Math.random()}>
          <h3 className="text-lg font-semibold text-foreground mb-3">{module?.moduleName || 'Unnamed Module'}</h3>
          <div className="space-y-4">
            {Array.isArray(module?.prompts) && module.prompts.map((prompt: any) => (
              <PromptCard
                key={prompt?.id || Math.random()}
                prompt={{ ...prompt, lastUsed: usedPrompts[prompt?.id]?.lastUsed }}
                onCopy={onCopy}
                onMarkUsed={onMarkUsed}
                onExport={onExport}
                isReady={isPromptReady(prompt?.id || '', prompt?.dependencies || [])}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function IntegrationTab({ prompts, usedPrompts, onCopy, onMarkUsed, onExport, isPromptReady }: any) {
  if (!prompts || typeof prompts !== 'object') {
    return (
      <div className="bg-muted rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">No integration prompts available.</p>
      </div>
    );
  }

  const promptEntries = Object.entries(prompts).filter(([_, prompt]) => prompt != null);

  if (promptEntries.length === 0) {
    return (
      <div className="bg-muted rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">No integration prompts available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {promptEntries.map(([key, prompt]: [string, any]) => (
        <PromptCard
          key={prompt?.id || key}
          prompt={{ ...prompt, lastUsed: usedPrompts[prompt?.id]?.lastUsed }}
          onCopy={onCopy}
          onMarkUsed={onMarkUsed}
          onExport={onExport}
          isReady={isPromptReady(prompt?.id || '', prompt?.dependencies || [])}
        />
      ))}
    </div>
  );
}

function TestingTab({ prompts, usedPrompts, onCopy, onMarkUsed, onExport, isPromptReady }: any) {
  if (!prompts) {
    return (
      <div className="bg-muted rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">No testing prompts available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prompts.unitTests && (
        <PromptCard
          prompt={{ ...prompts.unitTests, lastUsed: usedPrompts[prompts.unitTests.id]?.lastUsed }}
          onCopy={onCopy}
          onMarkUsed={onMarkUsed}
          onExport={onExport}
          isReady={isPromptReady(prompts.unitTests.id, prompts.unitTests.dependencies)}
        />
      )}
      {prompts.integrationTests && (
        <PromptCard
          prompt={{ ...prompts.integrationTests, lastUsed: usedPrompts[prompts.integrationTests.id]?.lastUsed }}
          onCopy={onCopy}
          onMarkUsed={onMarkUsed}
          onExport={onExport}
          isReady={isPromptReady(prompts.integrationTests.id, prompts.integrationTests.dependencies)}
        />
      )}
      {prompts.e2eTests && (
        <PromptCard
          prompt={{ ...prompts.e2eTests, lastUsed: usedPrompts[prompts.e2eTests.id]?.lastUsed }}
          onCopy={onCopy}
          onMarkUsed={onMarkUsed}
          onExport={onExport}
          isReady={isPromptReady(prompts.e2eTests.id, prompts.e2eTests.dependencies)}
        />
      )}
    </div>
  );
}

// Helper function to get all prompts from Phase4Data
function getAllPrompts(data: Phase4Data) {
  if (!data || !data.prompts) {
    return [];
  }

  const prompts = [
    data.prompts.database?.schemaDefinition,
    data.prompts.database?.migrations,
    data.prompts.database?.seedData,
    ...(Array.isArray(data.prompts.backend) ? data.prompts.backend.flatMap(m => m?.prompts || []) : []),
    ...(Array.isArray(data.prompts.frontend) ? data.prompts.frontend.flatMap(m => m?.prompts || []) : []),
    data.prompts.integration?.authentication,
    data.prompts.integration?.authorization,
    data.prompts.integration?.apiClient,
    data.prompts.integration?.errorHandling,
    data.prompts.integration?.dataMigration,
    data.prompts.testing?.unitTests,
    data.prompts.testing?.integrationTests,
    data.prompts.testing?.e2eTests,
  ].filter(Boolean); // Remove undefined entries
  return prompts;
}
