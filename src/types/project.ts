export interface Project {
  id: string;
  name: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
  currentPhase: 1 | 2 | 3;
  status: "draft" | "in_progress" | "completed";
  phase1: Phase1Data | null;
  phase2: Phase2Data | null;
  phase3: Phase3Data | null;
}

export interface Phase1Data {
  transcript: string;
  executiveSummary: {
    goal: string;
    painPoints: string[];
  };
  userRoles: { name: string; description: string }[];
  businessLogic: {
    currentState: WorkflowStep[];
    futureState: WorkflowStep[];
  };
  requirements: RequirementModule[];
  artifactMapping: ArtifactReference[];
  dataEntities: string[];
  openQuestions: string[];
}

export interface WorkflowStep {
  step: number;
  description: string;
  conditional?: string;
}

export interface RequirementModule {
  moduleName: string;
  requirements: Requirement[];
}

export interface Requirement {
  id: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  context: string;
  checked: boolean;
}

export interface ArtifactReference {
  id: string;
  name: string;
  context: string;
  expectedFields: string[];
  status: "pending" | "uploaded" | "analyzed";
  fileName?: string;
}

export interface Phase2Data {
  artifacts: AnalyzedArtifact[];
  validationResults: ValidationResult[];
}

export interface AnalyzedArtifact {
  id: string;
  name: string;
  fileName: string;
  headers: string[];
  sampleRows: Record<string, string>[];
  formulasFound: string[];
  dataTypes: Record<string, string>;
  entityRelationships: string[];
}

export interface ValidationResult {
  field: string;
  status: "match" | "mismatch" | "extra";
  message: string;
}

export interface Phase3Data {
  prdMarkdown: string;
  modules: ERPModule[];
  dataModel: EntityDefinition[];
  confidence: number;
  generatedAt: string;
}

export interface ERPModule {
  name: string;
  description: string;
  requirements: string[];
  priority: "Critical" | "High" | "Medium" | "Low";
}

export interface EntityDefinition {
  name: string;
  fields: { name: string; type: string; required: boolean }[];
  relationships: string[];
}
