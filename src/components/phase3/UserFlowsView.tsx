import type { UserFlow } from "@/types/project";
import { GitBranch, User, Zap, AlertTriangle, Shield, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface UserFlowsViewProps {
  flows: UserFlow[];
}

export function UserFlowsView({ flows }: UserFlowsViewProps) {
  const [expandedFlow, setExpandedFlow] = useState<string>(flows[0]?.name ?? "");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <GitBranch className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">User Flows & Business Logic</h3>
          <p className="text-xs text-muted-foreground">Workflows with injected formulas from spreadsheet analysis</p>
        </div>
      </div>

      {/* Flows */}
      <div className="space-y-4">
        {flows.map((flow) => {
          const isExpanded = expandedFlow === flow.name;
          return (
            <div key={flow.name} className="border border-border/60 rounded-2xl bg-white overflow-hidden">
              <button
                onClick={() => setExpandedFlow(isExpanded ? "" : flow.name)}
                className="w-full px-4 py-3.5 border-b border-border/40 flex items-center justify-between hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-sm text-foreground">{flow.name}</h4>
                    <p className="text-xs text-muted-foreground">{flow.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    {flow.steps.length} steps
                  </span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 space-y-4 animate-fade-in">
                  {/* Steps */}
                  <div className="space-y-3">
                    {flow.steps.map((step, i) => (
                      <div key={step.step} className="flex gap-3">
                        {/* Step Number */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                            step.actor === "System"
                              ? "bg-indigo-100 text-indigo-600"
                              : "bg-emerald-100 text-emerald-600"
                          }`}>
                            {step.step}
                          </div>
                          {i < flow.steps.length - 1 && (
                            <div className="w-0.5 h-full min-h-[20px] bg-border/60 mt-1" />
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 pb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              step.actor === "System"
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {step.actor === "System" ? <Zap className="w-3 h-3 inline mr-1" /> : <User className="w-3 h-3 inline mr-1" />}
                              {step.actor}
                            </span>
                            {step.condition && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-3 h-3 inline mr-1" />
                                {step.condition}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground">{step.action}</p>
                          {step.formula && (
                            <code className="block mt-2 text-[11px] bg-slate-900 text-emerald-400 px-3 py-2 rounded-lg font-mono leading-relaxed overflow-x-auto">
                              {step.formula}
                            </code>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Permissions Matrix */}
                  <div className="border-t border-border/40 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <h5 className="font-semibold text-sm text-foreground">Permission Matrix</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {flow.permissions.map((perm) => (
                        <div key={perm.role} className="p-3 rounded-xl bg-purple-50/30 border border-purple-100">
                          <span className="text-xs font-bold text-purple-700 block mb-2">{perm.role}</span>
                          <div className="flex flex-wrap gap-1">
                            {perm.actions.map((action) => (
                              <span key={action} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-purple-200 text-purple-600">
                                {action}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
