import { useState, useEffect } from 'react';

interface ProgressMilestone {
  at: number;        // milliseconds from start
  message: string;   // status message to display
  percentage: number; // 0-100
}

const PHASE_MILESTONES: Record<1 | 2 | 3 | 4, ProgressMilestone[]> = {
  1: [ // Phase 1: Transcript Analysis (~30 seconds)
    { at: 0, message: "Parsing transcript structure...", percentage: 5 },
    { at: 3000, message: "Identifying user roles and workflows...", percentage: 20 },
    { at: 8000, message: "Extracting business logic and rules...", percentage: 40 },
    { at: 15000, message: "Mapping data entities and relationships...", percentage: 60 },
    { at: 22000, message: "Cataloging artifacts and requirements...", percentage: 80 },
    { at: 28000, message: "Finalizing requirements extraction...", percentage: 95 }
  ],
  2: [ // Phase 2: Artifact Analysis (~10 seconds)
    { at: 0, message: "Parsing spreadsheet data...", percentage: 10 },
    { at: 2000, message: "Analyzing schema structure...", percentage: 30 },
    { at: 4000, message: "Extracting formulas and logic...", percentage: 50 },
    { at: 6000, message: "Validating data patterns...", percentage: 70 },
    { at: 8000, message: "Generating insights...", percentage: 95 }
  ],
  3: [ // Phase 3: PRD Generation (~15 seconds)
    { at: 0, message: "Synthesizing requirements...", percentage: 10 },
    { at: 3000, message: "Building architecture model...", percentage: 30 },
    { at: 7000, message: "Generating user flows...", percentage: 60 },
    { at: 11000, message: "Creating migration plan...", percentage: 85 },
    { at: 14000, message: "Finalizing specification...", percentage: 95 }
  ],
  4: [ // Phase 4: Implementation Prompts (~20 seconds)
    { at: 0, message: "Analyzing PRD structure...", percentage: 5 },
    { at: 3000, message: "Mapping modules to implementation layers...", percentage: 20 },
    { at: 7000, message: "Generating database setup prompts...", percentage: 40 },
    { at: 11000, message: "Creating backend module prompts...", percentage: 60 },
    { at: 15000, message: "Generating frontend component prompts...", percentage: 80 },
    { at: 18000, message: "Finalizing implementation guide...", percentage: 95 }
  ]
};

export function useAnalysisProgress(
  phase: 1 | 2 | 3 | 4,
  isActive: boolean,
  forceComplete?: boolean  // NEW parameter to signal completion
) {
  const [progress, setProgress] = useState({ message: '', percentage: 0 });

  // Handle forced completion
  useEffect(() => {
    if (forceComplete) {
      const completionMessages = {
        1: "Analysis complete!",
        2: "Artifact analysis complete!",
        3: "PRD generated successfully!",
        4: "Implementation prompts generated!"
      };
      setProgress({
        message: completionMessages[phase],
        percentage: 100
      });
    }
  }, [forceComplete, phase]);

  useEffect(() => {
    if (!isActive) {
      setProgress({ message: '', percentage: 0 });
      return;
    }

    const milestones = PHASE_MILESTONES[phase];
    const timeouts: NodeJS.Timeout[] = [];

    milestones.forEach((milestone) => {
      const timeout = setTimeout(() => {
        setProgress({ message: milestone.message, percentage: milestone.percentage });
      }, milestone.at);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [phase, isActive]);

  return progress;
}
