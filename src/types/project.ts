export interface Project {
  id: string;
  name: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
  currentPhase: 1 | 2 | 3 | 4;
  status: "draft" | "in_progress" | "completed";
  phase1: Phase1Data | null;
  phase2: Phase2Data | null;
  phase3: Phase3Data | null;
  phase4: Phase4Data | null;
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
  inScope?: boolean; // User can mark module as in/out of scope
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
  inScope?: boolean; // User can mark artifact as in/out of scope
  sheetName?: string; // Specific sheet/tab name in the spreadsheet
  uploadedFile?: File; // Store the uploaded file object
  availableSheets?: string[]; // Available sheet names from the uploaded file
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

// ─── Phase 4 (Implementation Prompts) ──────────────────────

export interface Phase4Data {
  generatedAt: string;
  techStack: TechStackConfig;
  prompts: PromptCollection;
  metadata: Phase4Metadata;
}

export interface TechStackConfig {
  backend: {
    framework: 'Node.js + Express' | 'Django' | 'FastAPI' | 'ASP.NET Core';
    database: 'PostgreSQL' | 'MySQL' | 'MongoDB' | 'SQL Server';
    orm: 'Prisma' | 'TypeORM' | 'SQLAlchemy' | 'Entity Framework';
  };
  frontend: {
    framework: 'React' | 'Vue' | 'Angular' | 'Svelte';
    stateManagement: 'Redux' | 'Zustand' | 'Pinia' | 'Context API';
    uiLibrary: 'Material-UI' | 'Ant Design' | 'Chakra UI' | 'Tailwind + shadcn';
  };
  deployment: {
    platform: 'AWS' | 'Azure' | 'GCP' | 'Vercel' | 'Docker';
    authentication: 'JWT' | 'OAuth2' | 'Auth0' | 'Supabase Auth';
  };
}

export interface PromptCollection {
  database: DatabasePrompts;
  backend: ModulePrompts[];
  frontend: ModulePrompts[];
  integration: IntegrationPrompts;
  testing: TestingPrompts;
}

export interface DatabasePrompts {
  schemaDefinition: PromptCard;
  migrations: PromptCard;
  seedData: PromptCard;
}

export interface ModulePrompts {
  moduleName: string;
  prompts: PromptCard[];
}

export interface IntegrationPrompts {
  authentication: PromptCard;
  authorization: PromptCard;
  apiClient: PromptCard;
  errorHandling: PromptCard;
  dataMigration: PromptCard;
}

export interface TestingPrompts {
  unitTests: PromptCard;
  integrationTests: PromptCard;
  e2eTests: PromptCard;
}

export interface PromptCard {
  id: string;
  title: string;
  description: string;
  estimatedComplexity: 'Simple' | 'Moderate' | 'Complex';
  estimatedTokens: number;
  dependencies: string[];
  prompt: string;
  expectedOutputs: string[];
  verificationCriteria: string[];
  tags: string[];
  usageCount?: number;
  lastUsed?: string;
}

export interface Phase4Metadata {
  totalPrompts: number;
  estimatedImplementationTime: string;
  implementationOrder: string[];
  criticalPathPrompts: string[];
}
