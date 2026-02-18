import { Check, Lock, Loader2 } from "lucide-react";

interface PhaseStepperProps {
  currentPhase: 1 | 2 | 3;
  completedPhases: number[];
  onPhaseClick?: (phase: 1 | 2 | 3) => void;
  processing?: boolean;
}

const phases = [
  { phase: 1 as const, label: "Meeting Context", description: "Extract requirements from transcript" },
  { phase: 2 as const, label: "Artifact Analysis", description: "Parse spreadsheets & data files" },
  { phase: 3 as const, label: "ERP Synthesis", description: "Generate final PRD specification" },
];

export function PhaseStepper({ currentPhase, completedPhases, onPhaseClick, processing }: PhaseStepperProps) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-center gap-0">
        {phases.map((p, i) => {
          const isCompleted = completedPhases.includes(p.phase);
          const isActive = p.phase === currentPhase;
          const isLocked = !isCompleted && !isActive;
          const isProcessing = isActive && processing;

          return (
            <div key={p.phase} className="flex items-center">
              <button
                onClick={() => !isLocked && onPhaseClick?.(p.phase)}
                disabled={isLocked}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-50 border-2 border-indigo-200 shadow-sm"
                    : isCompleted
                    ? "bg-emerald-50 border-2 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                    : "bg-muted/40 border-2 border-transparent opacity-50 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                      : isCompleted
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isLocked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    p.phase
                  )}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold leading-none ${
                    isActive ? "text-indigo-700" : isCompleted ? "text-emerald-700" : "text-gray-400"
                  }`}>
                    {p.label}
                  </p>
                  <p className={`text-[11px] mt-0.5 leading-none ${
                    isActive ? "text-indigo-500" : isCompleted ? "text-emerald-500" : "text-gray-300"
                  }`}>
                    {p.description}
                  </p>
                </div>
              </button>

              {i < phases.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 rounded-full transition-colors ${
                  completedPhases.includes(p.phase) ? "bg-emerald-300" : "bg-gray-200"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="md:hidden flex items-center justify-between px-2">
        {phases.map((p, i) => {
          const isCompleted = completedPhases.includes(p.phase);
          const isActive = p.phase === currentPhase;
          const isProcessing = isActive && processing;

          return (
            <div key={p.phase} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    p.phase
                  )}
                </div>
                <p className={`text-[10px] font-semibold mt-1.5 text-center ${
                  isActive ? "text-indigo-700" : isCompleted ? "text-emerald-600" : "text-gray-400"
                }`}>
                  {p.label}
                </p>
              </div>
              {i < phases.length - 1 && (
                <div className={`w-full h-0.5 rounded-full -mt-4 ${
                  isCompleted ? "bg-emerald-300" : "bg-gray-200"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
