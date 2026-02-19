import type { ArchitectureSpec } from "@/types/project";
import { Database, ArrowRight, Key, Link2 } from "lucide-react";
import { useState } from "react";

interface ArchitectureViewProps {
  architecture: ArchitectureSpec;
}

const moduleColors: Record<string, { bg: string; border: string; text: string }> = {
  Core: { bg: "bg-slate-50 dark:bg-slate-950/30", border: "border-slate-200 dark:border-slate-800", text: "text-slate-700 dark:text-slate-300" },
  Pricing: { bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-800", text: "text-indigo-700 dark:text-indigo-300" },
  Inventory: { bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-800", text: "text-cyan-700 dark:text-cyan-300" },
  CRM: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-300" },
  O2C: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-300" },
  P2P: { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800", text: "text-purple-700 dark:text-purple-300" },
  Compliance: { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800", text: "text-rose-700 dark:text-rose-300" },
};

export function ArchitectureView({ architecture }: ArchitectureViewProps) {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  const getModuleColor = (module: string) => moduleColors[module] || moduleColors.Core;

  // Group entities by module
  const groupedEntities = architecture.entities.reduce((acc, entity) => {
    if (!acc[entity.module]) acc[entity.module] = [];
    acc[entity.module].push(entity);
    return acc;
  }, {} as Record<string, typeof architecture.entities>);

  const selectedEntityData = architecture.entities.find((e) => e.name === selectedEntity);
  const relatedRelationships = architecture.relationships.filter(
    (r) => r.from === selectedEntity || r.to === selectedEntity
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">System Architecture & Schema</h3>
          <p className="text-xs text-muted-foreground">Entity Relationship Diagram — click an entity to see details</p>
        </div>
      </div>

      {/* Entity Grid by Module */}
      <div className="space-y-4">
        {Object.entries(groupedEntities).map(([module, entities]) => {
          const colors = getModuleColor(module);
          return (
            <div key={module}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                  {module}
                </span>
                <span className="text-xs text-muted-foreground">{entities.length} entities</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {entities.map((entity) => {
                  const isSelected = selectedEntity === entity.name;
                  const hasRelation = relatedRelationships.some(
                    (r) => r.from === entity.name || r.to === entity.name
                  );
                  return (
                    <button
                      key={entity.name}
                      onClick={() => setSelectedEntity(isSelected ? null : entity.name)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? `${colors.border} ${colors.bg} shadow-md`
                          : selectedEntity && hasRelation
                          ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30"
                          : "border-border/60 bg-card hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Database className={`w-3.5 h-3.5 ${isSelected ? colors.text : "text-muted-foreground"}`} />
                        <span className={`font-mono font-bold text-sm ${isSelected ? colors.text : "text-foreground"}`}>
                          {entity.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {entity.attributes.length} fields
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Entity Detail */}
      {selectedEntityData && (
        <div className="border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-mono font-bold text-indigo-900 dark:text-indigo-300">{selectedEntityData.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getModuleColor(selectedEntityData.module).bg} ${getModuleColor(selectedEntityData.module).text}`}>
                {selectedEntityData.module}
              </span>
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
            >
              Close
            </button>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Attributes */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Attributes ({selectedEntityData.attributes.length})
              </p>
              <div className="space-y-1.5">
                {selectedEntityData.attributes.map((attr) => (
                  <div key={attr.name} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-indigo-100 dark:border-indigo-900">
                    {attr.constraint?.includes("PRIMARY") && <Key className="w-3 h-3 text-amber-500" />}
                    {attr.constraint?.includes("FK") && <Link2 className="w-3 h-3 text-cyan-500" />}
                    <span className="font-mono text-xs font-medium text-foreground">{attr.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-mono ml-auto">
                      {attr.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Relationships */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Relationships ({relatedRelationships.length})
              </p>
              <div className="space-y-1.5">
                {relatedRelationships.map((rel, i) => {
                  const isFrom = rel.from === selectedEntity;
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-indigo-100 dark:border-indigo-900">
                      <span className={`font-mono text-xs font-medium ${isFrom ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`}>
                        {rel.from}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className={`font-mono text-xs font-medium ${!isFrom ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`}>
                        {rel.to}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-auto">
                        {rel.type}
                      </span>
                    </div>
                  );
                })}
                {relatedRelationships.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No direct relationships</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relationships Summary */}
      <div className="border border-border/60 rounded-2xl bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h4 className="font-semibold text-sm text-foreground">All Relationships</h4>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 dark:text-cyan-300">
            {architecture.relationships.length}
          </span>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {architecture.relationships.map((rel, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <span className="font-mono text-xs font-medium text-foreground">{rel.from}</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <ArrowRight className="w-3 h-3" />
                <span className="text-[10px]">{rel.label}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
              <span className="font-mono text-xs font-medium text-foreground">{rel.to}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-auto">
                {rel.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
