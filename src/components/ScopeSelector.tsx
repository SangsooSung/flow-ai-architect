import { useState } from "react";
import type { Phase1Data } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, FileSpreadsheet, CheckCircle2, XCircle, ArrowRight, ArrowLeft } from "lucide-react";

interface ScopeSelectorProps {
  phase1Data: Phase1Data;
  onConfirm: (updatedData: Phase1Data) => void;
  onBack?: () => void;
  isEditMode?: boolean;
}

export function ScopeSelector({ phase1Data, onConfirm, onBack, isEditMode = false }: ScopeSelectorProps) {
  // Initialize all modules and artifacts as in-scope by default
  const [modules, setModules] = useState(
    phase1Data.requirements.map((mod) => ({
      ...mod,
      inScope: mod.inScope ?? true,
    }))
  );

  const [artifacts, setArtifacts] = useState(
    phase1Data.artifactMapping.map((art) => ({
      ...art,
      inScope: art.inScope ?? true,
    }))
  );

  const toggleModule = (index: number) => {
    setModules((prev) =>
      prev.map((mod, i) => (i === index ? { ...mod, inScope: !mod.inScope } : mod))
    );
  };

  const toggleArtifact = (index: number) => {
    setArtifacts((prev) =>
      prev.map((art, i) => (i === index ? { ...art, inScope: !art.inScope } : art))
    );
  };

  const selectAllModules = () => {
    setModules((prev) => prev.map((mod) => ({ ...mod, inScope: true })));
  };

  const deselectAllModules = () => {
    setModules((prev) => prev.map((mod) => ({ ...mod, inScope: false })));
  };

  const selectAllArtifacts = () => {
    setArtifacts((prev) => prev.map((art) => ({ ...art, inScope: true })));
  };

  const deselectAllArtifacts = () => {
    setArtifacts((prev) => prev.map((art) => ({ ...art, inScope: false })));
  };

  const handleConfirm = () => {
    const updatedData: Phase1Data = {
      ...phase1Data,
      requirements: modules,
      artifactMapping: artifacts,
    };
    onConfirm(updatedData);
  };

  const inScopeModules = modules.filter((m) => m.inScope).length;
  const inScopeArtifacts = artifacts.filter((a) => a.inScope).length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="border-l-4 border-indigo-500 dark:border-indigo-600 pl-4 py-2">
        <h2 className="text-lg font-bold text-foreground mb-1">
          {isEditMode ? "Update Project Scope" : "Define Project Scope"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? "Modify which modules and artifacts to include. Changes will update the artifact upload list."
            : "Select which modules and artifacts are in scope for this project. You'll only need to upload files for in-scope artifacts."}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="flex gap-4">
        <Card className="flex-1 p-4 bg-gradient-to-br from-indigo-50 dark:from-indigo-950/30 to-white dark:to-background border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Modules in Scope</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {inScopeModules} / {modules.length}
              </p>
            </div>
            <Layers className="w-8 h-8 text-indigo-400" />
          </div>
        </Card>

        <Card className="flex-1 p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Artifacts in Scope</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {inScopeArtifacts} / {artifacts.length}
              </p>
            </div>
            <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
          </div>
        </Card>
      </div>

      {/* Modules Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-foreground">Requirement Modules</h3>
            <Badge variant="secondary">{modules.length} total</Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAllModules}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              All
            </Button>
            <Button size="sm" variant="outline" onClick={deselectAllModules}>
              <XCircle className="w-3.5 h-3.5 mr-1" />
              None
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {modules.map((module, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                module.inScope
                  ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
                  : "bg-muted/50 border-border opacity-60"
              }`}
            >
              <Checkbox
                checked={module.inScope}
                onCheckedChange={() => toggleModule(index)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground mb-1">{module.moduleName}</p>
                <p className="text-xs text-muted-foreground">
                  {module.requirements.length} requirement(s)
                </p>
              </div>
              {module.inScope && (
                <Badge className="bg-indigo-500 text-white">In Scope</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Artifacts Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-foreground">Data Artifacts</h3>
            <Badge variant="secondary">{artifacts.length} total</Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAllArtifacts}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              All
            </Button>
            <Button size="sm" variant="outline" onClick={deselectAllArtifacts}>
              <XCircle className="w-3.5 h-3.5 mr-1" />
              None
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {artifacts.map((artifact, index) => (
            <div
              key={artifact.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                artifact.inScope
                  ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                  : "bg-muted/50 border-border opacity-60"
              }`}
            >
              <Checkbox
                checked={artifact.inScope}
                onCheckedChange={() => toggleArtifact(index)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground mb-1">{artifact.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{artifact.context}</p>
                <div className="flex flex-wrap gap-1">
                  {artifact.expectedFields.slice(0, 5).map((field, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                  {artifact.expectedFields.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{artifact.expectedFields.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
              {artifact.inScope && (
                <Badge className="bg-emerald-500 text-white">In Scope</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-between gap-3 pt-4 border-t">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analysis
          </Button>
        )}
        <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground">
          <p>
            You'll upload <span className="font-bold text-foreground">{inScopeArtifacts}</span>{" "}
            artifact file(s) in the next step
          </p>
        </div>
        <Button
          onClick={handleConfirm}
          disabled={inScopeModules === 0 && inScopeArtifacts === 0}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
        >
          {isEditMode ? "Update Scope & Return to Upload" : "Confirm Scope & Continue"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
