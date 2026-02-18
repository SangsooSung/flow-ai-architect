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

// ─── Phase 1 ───────────────────────────────────────────

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

// ─── Phase 2 (Enhanced) ────────────────────────────────

export interface Phase2Data {
  artifacts: AnalyzedArtifact[];
  schemas: SchemaDefinition[];
  logicAnalysis: LogicAnalysis;
  contextValidation: ContextValidation[];
  normalization: NormalizationRecommendation[];
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

export interface SchemaDefinition {
  proposedTableName: string;
  artifactId: string;
  artifactName: string;
  columns: SchemaColumn[];
}

export interface SchemaColumn {
  columnName: string;
  targetType: string;
  description: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface LogicAnalysis {
  calculatedFields: CalculatedField[];
  categoricalRules: CategoricalRule[];
  implicitKeys: ImplicitKey[];
}

export interface CalculatedField {
  fieldName: string;
  formula: string;
  sourceArtifact: string;
  confidence: "Certain" | "Likely" | "Inferred";
}

export interface CategoricalRule {
  columnName: string;
  sourceArtifact: string;
  distinctValues: string[];
  recommendedType: string;
}

export interface ImplicitKey {
  columnName: string;
  sourceArtifact: string;
  keyType: "Primary" | "Foreign" | "Composite";
  evidence: string;
}

export interface ContextValidation {
  type: "confirmed" | "discrepancy" | "surprise";
  field: string;
  meetingClaim?: string;
  dataEvidence: string;
  recommendation?: string;
  severity: "critical" | "warning" | "info";
}

export interface NormalizationRecommendation {
  sourceDescription: string;
  sourceArtifact: string;
  proposedEntities: { name: string; linkedBy: string }[];
  rationale: string;
}

export interface ValidationResult {
  field: string;
  status: "match" | "mismatch" | "extra";
  message: string;
}

// ─── Phase 3 (Enhanced) ────────────────────────────────

export interface Phase3Data {
  prdMarkdown: string;
  confidence: number;
  generatedAt: string;
  projectOverview: ProjectOverview;
  architecture: ArchitectureSpec;
  userFlows: UserFlow[];
  migrationPlan: MigrationPlan;
  conflicts: ConflictResolution[];
  blockingQuestions: string[];
  modules: ERPModule[];
  dataModel: EntityDefinition[];
}

export interface ProjectOverview {
  objective: string;
  scopeIn: string[];
  scopeOut: string[];
}

export interface ArchitectureSpec {
  entities: ArchitectureEntity[];
  relationships: ArchitectureRelationship[];
}

export interface ArchitectureEntity {
  name: string;
  module: string;
  attributes: { name: string; type: string; constraint?: string }[];
}

export interface ArchitectureRelationship {
  from: string;
  to: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  label: string;
}

export interface UserFlow {
  name: string;
  description: string;
  steps: UserFlowStep[];
  permissions: { role: string; actions: string[] }[];
}

export interface UserFlowStep {
  step: number;
  action: string;
  actor: string;
  formula?: string;
  condition?: string;
}

export interface MigrationPlan {
  mappings: MigrationMapping[];
  importOrder: string[];
}

export interface MigrationMapping {
  sourceSheet: string;
  targetTable: string;
  estimatedRows: string;
  cleanupNotes: string[];
  status: "ready" | "needs_cleanup" | "blocked";
}

export interface ConflictResolution {
  id: string;
  clientClaim: string;
  dataReality: string;
  recommendation: string;
  severity: "critical" | "warning";
  resolved: boolean;
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
