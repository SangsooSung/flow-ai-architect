import { callBedrock, isBedrockConfigured } from '@/lib/bedrock';
import { mockPhase1Data, mockPhase2Data, mockPhase3Data } from '@/data/mockData';
import type { Phase1Data, Phase2Data, Phase3Data, Phase4Data, TechStackConfig } from '@/types/project';
import { toast } from 'sonner';

/**
 * Attempt to repair common JSON formatting issues and truncation
 */
function repairJSON(jsonText: string): string {
  let repaired = jsonText.trim();

  console.log('Starting repair. Original length:', repaired.length);

  // Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Find the last valid complete structure
  // Strategy: Find the last properly closed field and truncate after it
  let lastValidPos = repaired.length;

  // Look for incomplete string values (missing closing quote)
  const unclosedString = repaired.match(/"[^"]*$/);
  if (unclosedString) {
    console.log('Found unclosed string at end');
    lastValidPos = repaired.lastIndexOf(unclosedString[0]);
  }

  // Look for incomplete property declarations
  const incompleteProperty = repaired.match(/,\s*"[^"]*:\s*"[^"]*$/);
  if (incompleteProperty) {
    console.log('Found incomplete property declaration');
    const pos = repaired.lastIndexOf(incompleteProperty[0]);
    if (pos > 0) lastValidPos = Math.min(lastValidPos, pos);
  }

  // Look for the last complete property (ends with " or } or ])
  const lastGoodChar = repaired.substring(0, lastValidPos).search(/["\}\]]\s*$/);
  if (lastGoodChar > 0) {
    console.log('Found last good character at:', lastGoodChar);
    repaired = repaired.substring(0, lastGoodChar + 1);
  }

  // Count opening and closing braces/brackets
  let openBraces = (repaired.match(/\{/g) || []).length;
  let closeBraces = (repaired.match(/\}/g) || []).length;
  let openBrackets = (repaired.match(/\[/g) || []).length;
  let closeBrackets = (repaired.match(/\]/g) || []).length;

  console.log(`Structure count: {${openBraces}/${closeBraces}} [${openBrackets}/${closeBrackets}]`);

  // Add closing brackets and braces
  if (openBrackets > closeBrackets) {
    const toClose = openBrackets - closeBrackets;
    console.log(`Adding ${toClose} closing brackets`);
    repaired += ']'.repeat(toClose);
  }
  if (openBraces > closeBraces) {
    const toClose = openBraces - closeBraces;
    console.log(`Adding ${toClose} closing braces`);
    repaired += '}'.repeat(toClose);
  }

  console.log('Repair complete. Final length:', repaired.length);
  return repaired;
}

/**
 * Phase 1: Meeting Context Extraction
 *
 * According to PRD Section 5: "The Listener"
 * Converts messy human conversation into structured skeleton
 */
const PHASE1_SYSTEM_PROMPT = `You are an expert Forward Deployed Architect (FDA) and Technical Product Manager at Flow AI. Your goal is to scope a custom ERP solution for a client. You possess deep knowledge of database schema design, business process modeling, and enterprise software architecture.

**Task:**
Analyze the provided meeting transcript between Flow AI engineers and Client Stakeholders. Your objective is to extract a structured **Preliminary Requirements Definition**.

**Output Instructions:**
Return a valid JSON object with the following structure:

{
  "executiveSummary": {
    "goal": "High-level business objective (e.g., 'Automate inventory forecasting')",
    "painPoints": ["List of current pain points"]
  },
  "userRoles": [
    {"name": "Role Name", "description": "What they do"}
  ],
  "businessLogic": {
    "currentState": [
      {"step": 1, "description": "Current step description", "conditional": "optional conditional"}
    ],
    "futureState": [
      {"step": 1, "description": "Future step description", "conditional": "optional conditional"}
    ]
  },
  "requirements": [
    {
      "moduleName": "Module Name (e.g., Inventory Management)",
      "requirements": [
        {
          "id": "unique-id",
          "description": "Requirement description",
          "priority": "High|Medium|Low",
          "context": "Quote or reference from transcript",
          "checked": false
        }
      ]
    }
  ],
  "artifactMapping": [
    {
      "id": "art-1",
      "name": "Artifact name (e.g., 'Pricing Matrix Spreadsheet')",
      "context": "Why client mentioned this",
      "expectedFields": ["SKU", "Price", "etc"],
      "status": "pending"
    }
  ],
  "dataEntities": ["Customer", "Order", "Product", "etc"],
  "openQuestions": ["Questions that need clarification"]
}

**Processing Rules:**
1. Ignore small talk and pleasantries
2. Focus on "if/then" statements and calculation rules
3. Flag every external file mention (spreadsheets, databases) in artifactMapping
4. Use standard ERP terminology (Procure-to-Pay, O2C, etc.)`;

/**
 * Phase 2: Artifact & Logic Analysis
 *
 * According to PRD Section 5: "The Analyst"
 * Captures data reality and grounds in hard facts
 */
const PHASE2_SYSTEM_PROMPT = `You are a Senior Data Architect and ERP Solutions Expert at Flow AI. You specialize in reverse-engineering legacy business processes from Excel spreadsheets and mapping them to structured database schemas.

**Task:**
Analyze the provided spreadsheet data to validate, correct, and detail the meeting context. Determine if the data supports the client's verbal claims and extract precise logic for the ERP codebase.

**Output Instructions:**
Return a valid JSON object with the following structure:

{
  "artifacts": [
    {
      "id": "art-1",
      "name": "Artifact name",
      "fileName": "file.xlsx",
      "headers": ["Column1", "Column2"],
      "sampleRows": [{"Column1": "value1", "Column2": "value2"}],
      "formulasFound": ["=IF(A1>100, A1*0.9, A1)"],
      "dataTypes": {"Column1": "string", "Column2": "decimal"},
      "entityRelationships": ["Product → Inventory (one-to-many)"]
    }
  ],
  "schemas": [
    {
      "proposedTableName": "table_name",
      "artifactId": "art-1",
      "artifactName": "Artifact name",
      "columns": [
        {
          "columnName": "column_name",
          "targetType": "Varchar(20)|Decimal(10,2)|Integer|Enum",
          "description": "What this column represents",
          "nullable": false,
          "isPrimaryKey": false,
          "isForeignKey": false
        }
      ]
    }
  ],
  "logicAnalysis": {
    "calculatedFields": [
      {
        "fieldName": "Field name",
        "formula": "Exact formula",
        "sourceArtifact": "Artifact name",
        "confidence": "Certain|Likely|Inferred"
      }
    ],
    "categoricalRules": [
      {
        "columnName": "Column name",
        "sourceArtifact": "Artifact name",
        "distinctValues": ["Value1", "Value2"],
        "recommendedType": "Enum('Value1','Value2')"
      }
    ],
    "implicitKeys": [
      {
        "columnName": "Column name",
        "sourceArtifact": "Artifact name",
        "keyType": "Primary|Foreign|Composite",
        "evidence": "Why this is a key"
      }
    ]
  },
  "contextValidation": [
    {
      "type": "confirmed|discrepancy|surprise",
      "field": "Field name",
      "meetingClaim": "What client said (optional)",
      "dataEvidence": "What data shows",
      "recommendation": "What to do about it (optional)",
      "severity": "critical|warning|info"
    }
  ],
  "normalization": [
    {
      "sourceDescription": "How flat file currently looks",
      "sourceArtifact": "Artifact name",
      "proposedEntities": [
        {"name": "Entity1", "linkedBy": "foreign_key"}
      ],
      "rationale": "Why normalize this way"
    }
  ],
  "validationResults": [
    {
      "field": "Field name",
      "status": "match|mismatch|extra",
      "message": "Validation message"
    }
  ]
}

**Processing Guidelines:**
- Trust data over words: If client said X but data shows Y, flag as discrepancy
- Identify all categorical columns with their distinct values
- Note "dirty" data patterns (mixed types, formatting issues)
- CRITICAL: Flag when client claims don't match data reality`;

/**
 * Phase 3: Final PRD Synthesis
 *
 * According to PRD Section 5: "The Architect"
 * Synthesizes into final developer-ready artifact
 */
const PHASE3_SYSTEM_PROMPT = `You are the Lead Solutions Architect and Senior Product Manager at Flow AI. You are responsible for writing the final **Product Requirement Document (PRD)** for a new ERP implementation.

**Objective:**
Synthesize meeting requirements and data analysis into a single, cohesive, developer-ready specification. Reconcile human intent with data reality.

**CRITICAL OUTPUT LIMITS (MUST FOLLOW):**
- Total response < 20,000 characters
- prdMarkdown: MAX 1000 characters (not 2000)
- Entities: MAX 8 (not 10-15)
- UserFlows: MAX 5 (not 8)
- Conflicts: MAX 3
- Each field description: 1 line only, NO paragraphs

**Output Instructions:**
Return a MINIMAL JSON object with this structure:

{
  "prdMarkdown": "# PRD Summary (MAX 1000 chars)\n\nObjective: [1 sentence]\nModules: [comma-separated list]\nEntities: [comma-separated list]",
  "confidence": 85,
  "generatedAt": "ISO 8601 timestamp",
  "projectOverview": {
    "objective": "2-sentence summary",
    "scopeIn": ["What's in scope"],
    "scopeOut": ["What's out of scope"]
  },
  "architecture": {
    "entities": [
      {
        "name": "Entity name",
        "module": "Module name",
        "attributes": [
          {"name": "attr_name", "type": "Varchar(20)", "constraint": "PRIMARY KEY|FK|etc"}
        ]
      }
    ],
    "relationships": [
      {
        "from": "Entity1",
        "to": "Entity2",
        "type": "one-to-one|one-to-many|many-to-many",
        "label": "relationship description"
      }
    ]
  },
  "userFlows": [
    {
      "name": "Flow name",
      "description": "Flow description",
      "steps": [
        {
          "step": 1,
          "action": "What happens",
          "actor": "Who does it",
          "formula": "Optional formula from Phase 2",
          "condition": "Optional condition"
        }
      ],
      "permissions": [
        {"role": "Role name", "actions": ["action1", "action2"]}
      ]
    }
  ],
  "migrationPlan": {
    "mappings": [
      {
        "sourceSheet": "Sheet name",
        "targetTable": "Table name",
        "estimatedRows": "Estimate",
        "cleanupNotes": ["Note 1", "Note 2"],
        "status": "ready|needs_cleanup|blocked"
      }
    ],
    "importOrder": ["1. Entity1", "2. Entity2", "etc"]
  },
  "conflicts": [
    {
      "id": "conflict-1",
      "clientClaim": "What client said",
      "dataReality": "What data shows",
      "recommendation": "How to resolve",
      "severity": "critical|warning",
      "resolved": false
    }
  ],
  "blockingQuestions": ["Question 1", "Question 2"],
  "modules": [
    {
      "name": "Module name",
      "description": "Module description",
      "requirements": ["req-1", "req-2"],
      "priority": "Critical|High|Medium|Low"
    }
  ],
  "dataModel": [
    {
      "name": "Entity name",
      "fields": [
        {"name": "field", "type": "type", "required": true}
      ],
      "relationships": ["relationship descriptions"]
    }
  ]
}

**Synthesis Rules (STRICT):**
1. PRIORITIZE brevity - every character counts
2. Entities: MAX 8, only most critical ones
3. UserFlows: MAX 5, only high-priority workflows
4. Conflicts: MAX 3, only critical blockers
5. Descriptions: 1 line each, NO details
6. STOP generating before hitting 20,000 chars - better to be incomplete than invalid JSON
4. Document ALL conflicts between meeting and data
5. The markdown PRD must include: Project Overview, System Architecture, Business Logic with formulas, Data Migration, and Conflicts`;

/**
 * Call Phase 1: Analyze meeting transcript
 */
export async function analyzeTranscript(transcript: string): Promise<Phase1Data> {
  if (!isBedrockConfigured()) {
    console.warn('AWS Bedrock not configured, using mock data');
    return { ...mockPhase1Data, transcript };
  }

  let jsonText = '';

  try {
    const response = await callBedrock({
      system: PHASE1_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `**Input Transcript:**\n\n${transcript}\n\n**IMPORTANT:** Return ONLY a valid JSON object. Do not include explanatory text before or after the JSON. Be concise in your descriptions.`,
        },
      ],
      max_tokens: 16384,
      temperature: 0.5,
    });

    console.log('Phase 1 raw response length:', response.length);

    // Parse JSON response - try multiple extraction methods
    // Try markdown code block first
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    } else {
      // Try to find JSON object in response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      } else {
        console.error('Raw response (first 1000 chars):', response.substring(0, 1000));
        throw new Error('Failed to find JSON in response');
      }
    }

    console.log('Extracted JSON length:', jsonText.length);

    // Try to parse as-is first
    try {
      const parsed = JSON.parse(jsonText) as Omit<Phase1Data, 'transcript'>;
      return { ...parsed, transcript };
    } catch (parseError) {
      // If parsing fails, try to repair the JSON
      console.warn('Initial JSON parse failed, attempting to repair...');
      const repaired = repairJSON(jsonText);
      console.log('Repaired JSON length:', repaired.length);
      const parsed = JSON.parse(repaired) as Omit<Phase1Data, 'transcript'>;
      return { ...parsed, transcript };
    }
  } catch (error) {
    console.error('Phase 1 AI Error:', error);
    if (error instanceof SyntaxError) {
      console.error('JSON parsing failed at position:', (error as any).message);
      console.error('First 1000 chars of extracted JSON:', jsonText.substring(0, 1000));
      console.error('Last 1000 chars of extracted JSON:', jsonText.substring(Math.max(0, jsonText.length - 1000)));

      // Try to identify the problematic area
      const match = (error as any).message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        const start = Math.max(0, pos - 200);
        const end = Math.min(jsonText.length, pos + 200);
        console.error(`Context around error position ${pos}:`, jsonText.substring(start, end));
      }
    }
    throw error;
  }
}

/**
 * Call Phase 2: Analyze spreadsheet artifacts
 */
export async function analyzeArtifacts(
  phase1Data: Phase1Data,
  artifactData: { id: string; headers: string[]; sampleRows: Record<string, string>[] }[]
): Promise<Phase2Data> {
  if (!isBedrockConfigured()) {
    console.warn('AWS Bedrock not configured, using mock data');
    return mockPhase2Data;
  }

  let jsonText = '';

  try {
    const context = {
      artifactMapping: phase1Data.artifactMapping,
      businessLogic: phase1Data.businessLogic,
      requirements: phase1Data.requirements,
    };

    const response = await callBedrock({
      system: PHASE2_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `**Phase 1 Context:**
${JSON.stringify(context, null, 2)}

**Uploaded Artifacts:**
${JSON.stringify(artifactData, null, 2)}

**IMPORTANT:** Return ONLY a valid JSON object. Be concise.`,
        },
      ],
      max_tokens: 16384,
      temperature: 0.5,
    });

    // Parse JSON response - try multiple extraction methods
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    } else {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      } else {
        console.error('Raw response (first 1000 chars):', response.substring(0, 1000));
        throw new Error('Failed to find JSON in response');
      }
    }

    // Try to parse as-is first
    try {
      return JSON.parse(jsonText) as Phase2Data;
    } catch (parseError) {
      // If parsing fails, try to repair the JSON
      console.warn('Initial JSON parse failed, attempting to repair...');
      const repaired = repairJSON(jsonText);
      return JSON.parse(repaired) as Phase2Data;
    }
  } catch (error) {
    console.error('Phase 2 AI Error:', error);
    if (error instanceof SyntaxError) {
      console.error('JSON parsing failed. First 1000 chars:', jsonText.substring(0, 1000));
      console.error('Last 1000 chars:', jsonText.substring(Math.max(0, jsonText.length - 1000)));
    }
    throw error;
  }
}

/**
 * Call Phase 3: Generate final PRD
 */
export async function generatePRD(
  phase1Data: Phase1Data,
  phase2Data: Phase2Data
): Promise<Phase3Data> {
  if (!isBedrockConfigured()) {
    console.warn('AWS Bedrock not configured, using mock data');
    return { ...mockPhase3Data, generatedAt: new Date().toISOString() };
  }

  let jsonText = '';

  try {
    const response = await callBedrock({
      system: PHASE3_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `**Phase 1 - Meeting Requirements:**
${JSON.stringify(phase1Data, null, 2)}

**Phase 2 - Data Analysis:**
${JSON.stringify(phase2Data, null, 2)}

**ABSOLUTE REQUIREMENTS (FAILURE TO COMPLY = INVALID OUTPUT):**
1. Total response length: < 20,000 characters
2. prdMarkdown: < 1,000 characters (bullet points only)
3. Entities: Exactly 8, no more
4. UserFlows: Exactly 5, no more
5. Conflicts: Exactly 3, no more
6. DataModel: Exactly 8 entities, 5 fields max each
7. Each description: 1 line, < 100 chars
8. Close all braces properly - test JSON validity before sending

RETURN ONLY VALID, COMPLETE JSON. No extra text.`,
        },
      ],
      max_tokens: 6000,
      temperature: 0.3,
    });

    // Parse JSON response - try multiple extraction methods
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    } else {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      } else {
        console.error('Raw response (first 1000 chars):', response.substring(0, 1000));
        throw new Error('Failed to find JSON in response');
      }
    }

    // Try to parse as-is first
    try {
      const parsed = JSON.parse(jsonText) as Phase3Data;
      return { ...parsed, generatedAt: new Date().toISOString() };
    } catch (parseError) {
      // If parsing fails, try to repair the JSON
      console.warn('Initial JSON parse failed, attempting to repair...');
      const repaired = repairJSON(jsonText);
      const parsed = JSON.parse(repaired) as Phase3Data;
      return { ...parsed, generatedAt: new Date().toISOString() };
    }
  } catch (error) {
    console.error('Phase 3 AI Error:', error);
    if (error instanceof SyntaxError) {
      console.error('JSON parsing failed. Response length:', jsonText.length);
      console.error('First 1000 chars:', jsonText.substring(0, 1000));
      console.error('Last 1000 chars:', jsonText.substring(Math.max(0, jsonText.length - 1000)));

      // Check if response looks truncated
      const lastChars = jsonText.substring(Math.max(0, jsonText.length - 100));
      const isTruncated = !lastChars.includes('}') || jsonText.split('{').length > jsonText.split('}').length;

      if (isTruncated) {
        console.warn('Response appears truncated (missing closing braces)');
        // Try one more time with repaired JSON
        try {
          console.log('Attempting emergency repair...');
          const emergencyRepair = repairJSON(jsonText);
          console.log('Testing repaired JSON...');
          const parsed = JSON.parse(emergencyRepair) as Phase3Data;
          console.warn('Emergency repair succeeded!');
          toast.warning('PRD generated but may be incomplete due to complexity. Some sections may be missing.');
          return { ...parsed, generatedAt: new Date().toISOString() };
        } catch (repairError) {
          console.error('Emergency repair failed:', repairError);

          // Last resort: Return mock data with warning
          console.warn('Falling back to template data...');
          toast.error('PRD generation exceeded limits. Showing template data - please simplify your project and try again.');
          return {
            ...mockPhase3Data,
            generatedAt: new Date().toISOString(),
            confidence: 0, // Indicate this is mock data
          };
        }
      }

      // Provide a more helpful error message
      throw new Error(
        'Failed to generate complete PRD. The response exceeded output limits. ' +
        'This happens with very complex projects. Try:\n' +
        '• Reducing the number of artifacts in scope\n' +
        '• Simplifying your transcript\n' +
        '• Breaking your project into smaller phases'
      );
    }
    throw error;
  }
}

/**
 * Phase 4: Implementation Prompt Generation
 *
 * Generates modular, copy-paste ready AI prompts for building the ERP system
 */
const PHASE4_SYSTEM_PROMPT = `You are a Staff Software Engineer and DevOps Architect at Flow AI with 15+ years building enterprise ERP systems. You specialize in decomposing complex requirements into modular, implementation-ready prompts that AI systems can use to generate production code.

**Task:** Generate implementation prompts based on Phase 3 PRD.

**CRITICAL: You have ~8000 tokens. Distribute evenly across ALL 5 sections:**
1. Database (3 prompts) - ~1500 tokens
2. Backend (2-3 module prompts) - ~2000 tokens
3. Frontend (2-3 module prompts) - ~2000 tokens
4. Integration (5 prompts) - ~1500 tokens
5. Testing (3 prompts) - ~1000 tokens

**Token Budget Per Prompt:**
- Each prompt text: 800-1200 characters (very focused)
- Total prompts: 12-18 (not 20+)
- Output: Valid JSON matching Phase4Data interface

**MANDATORY: Generate ALL sections or response is invalid.**

**Prompt Engineering Principles:**
1. Role Clarity: One sentence role definition
2. Context Compression: Only critical Phase 3 data (no full descriptions)
3. Explicit Constraints: Tech stack, security basics
4. Output Specification: 3-5 key file paths only
5. Verification Criteria: 3 testable criteria maximum

**Prompt Structure Template (CONCISE):**
# ROLE: [One sentence]

# OBJECTIVE: [One sentence]

# CONTEXT:
- Entities: [names only]
- Key Rules: [2-3 rules max]

# TECH: [Stack from config]

# OUTPUT: [3-5 file paths]

# VERIFY:
1. [Criterion 1]
2. [Criterion 2]
3. [Criterion 3]

**Module Prioritization:** Focus on 2-3 Critical/High modules max for backend/frontend.

**REQUIRED Output Structure (ALL sections mandatory):**
{
  "generatedAt": "2026-02-18T...",
  "techStack": { "backend": {...}, "frontend": {...}, "deployment": {...} },
  "prompts": {
    "database": {
      "schemaDefinition": { "id": "db-schema", "title": "...", "prompt": "800-1200 chars", ... },
      "migrations": { "id": "db-migrations", "title": "...", "prompt": "800-1200 chars", ... },
      "seedData": { "id": "db-seed", "title": "...", "prompt": "800-1200 chars", ... }
    },
    "backend": [
      {
        "moduleName": "Module1",
        "prompts": [
          { "id": "backend-module1-api", "title": "...", "prompt": "800-1200 chars", "dependencies": [], "expectedOutputs": ["path1", "path2"], "verificationCriteria": ["c1", "c2", "c3"], "tags": ["backend"], "estimatedComplexity": "Moderate", "estimatedTokens": 5000, "description": "..." }
        ]
      }
    ],
    "frontend": [
      {
        "moduleName": "Module1",
        "prompts": [
          { "id": "frontend-module1-ui", "title": "...", "prompt": "800-1200 chars", ... }
        ]
      }
    ],
    "integration": {
      "authentication": { "id": "int-auth", "title": "...", "prompt": "800-1200 chars", ... },
      "authorization": { "id": "int-authz", "title": "...", "prompt": "800-1200 chars", ... },
      "apiClient": { "id": "int-api", "title": "...", "prompt": "800-1200 chars", ... },
      "errorHandling": { "id": "int-errors", "title": "...", "prompt": "800-1200 chars", ... },
      "dataMigration": { "id": "int-migration", "title": "...", "prompt": "800-1200 chars", ... }
    },
    "testing": {
      "unitTests": { "id": "test-unit", "title": "...", "prompt": "800-1200 chars", ... },
      "integrationTests": { "id": "test-integration", "title": "...", "prompt": "800-1200 chars", ... },
      "e2eTests": { "id": "test-e2e", "title": "...", "prompt": "800-1200 chars", ... }
    }
  },
  "metadata": {
    "totalPrompts": 15,
    "estimatedImplementationTime": "4-6 weeks",
    "implementationOrder": ["db-schema", "int-auth", "backend-module1-api", "frontend-module1-ui", "test-unit"],
    "criticalPathPrompts": ["db-schema", "int-auth"]
  }
}

**CRITICAL: You MUST generate ALL 5 sections (database, backend, frontend, integration, testing). If you run out of tokens, make prompts shorter, not skip sections.**

Return ONLY valid JSON.`;

/**
 * Call Phase 4: Generate implementation prompts
 */
export async function generateImplementationPrompts(
  phase3Data: Phase3Data,
  techStack?: Partial<TechStackConfig>
): Promise<Phase4Data> {
  if (!isBedrockConfigured()) {
    console.warn('AWS Bedrock not configured, returning minimal mock data');
    // Return minimal valid Phase4Data for testing
    return {
      generatedAt: new Date().toISOString(),
      techStack: {
        backend: { framework: 'Node.js + Express', database: 'PostgreSQL', orm: 'Prisma' },
        frontend: { framework: 'React', stateManagement: 'Zustand', uiLibrary: 'Tailwind + shadcn' },
        deployment: { platform: 'Docker', authentication: 'JWT' },
      },
      prompts: {
        database: {
          schemaDefinition: {
            id: 'database-schema',
            title: 'Database Schema Definition',
            description: 'Define PostgreSQL schema for all entities',
            estimatedComplexity: 'Moderate',
            estimatedTokens: 4000,
            dependencies: [],
            prompt: '# Mock prompt for database schema',
            expectedOutputs: ['prisma/schema.prisma'],
            verificationCriteria: ['Schema validates with Prisma'],
            tags: ['database', 'schema'],
          },
          migrations: {
            id: 'database-migrations',
            title: 'Database Migrations',
            description: 'Create initial migration scripts',
            estimatedComplexity: 'Simple',
            estimatedTokens: 2000,
            dependencies: ['database-schema'],
            prompt: '# Mock prompt for migrations',
            expectedOutputs: ['prisma/migrations/'],
            verificationCriteria: ['Migrations run successfully'],
            tags: ['database', 'migrations'],
          },
          seedData: {
            id: 'database-seed',
            title: 'Seed Data',
            description: 'Generate seed data for development',
            estimatedComplexity: 'Simple',
            estimatedTokens: 2000,
            dependencies: ['database-migrations'],
            prompt: '# Mock prompt for seed data',
            expectedOutputs: ['prisma/seed.ts'],
            verificationCriteria: ['Seed data loads correctly'],
            tags: ['database', 'testing'],
          },
        },
        backend: [],
        frontend: [],
        integration: {
          authentication: {
            id: 'integration-auth',
            title: 'Authentication System',
            description: 'JWT-based authentication',
            estimatedComplexity: 'Complex',
            estimatedTokens: 6000,
            dependencies: ['database-schema'],
            prompt: '# Mock prompt for auth',
            expectedOutputs: ['src/auth/'],
            verificationCriteria: ['Auth tokens validate correctly'],
            tags: ['integration', 'security'],
          },
          authorization: {
            id: 'integration-authz',
            title: 'Authorization & RBAC',
            description: 'Role-based access control',
            estimatedComplexity: 'Complex',
            estimatedTokens: 5000,
            dependencies: ['integration-auth'],
            prompt: '# Mock prompt for authz',
            expectedOutputs: ['src/auth/rbac.ts'],
            verificationCriteria: ['Roles enforce correctly'],
            tags: ['integration', 'security'],
          },
          apiClient: {
            id: 'integration-api-client',
            title: 'API Client',
            description: 'Frontend API client with axios',
            estimatedComplexity: 'Moderate',
            estimatedTokens: 3000,
            dependencies: ['integration-auth'],
            prompt: '# Mock prompt for API client',
            expectedOutputs: ['src/lib/api.ts'],
            verificationCriteria: ['API calls include auth headers'],
            tags: ['integration', 'frontend'],
          },
          errorHandling: {
            id: 'integration-errors',
            title: 'Error Handling',
            description: 'Centralized error handling',
            estimatedComplexity: 'Moderate',
            estimatedTokens: 3000,
            dependencies: [],
            prompt: '# Mock prompt for error handling',
            expectedOutputs: ['src/middleware/errorHandler.ts'],
            verificationCriteria: ['Errors logged and formatted correctly'],
            tags: ['integration', 'backend'],
          },
          dataMigration: {
            id: 'integration-migration',
            title: 'Data Migration Scripts',
            description: 'Import legacy data',
            estimatedComplexity: 'Complex',
            estimatedTokens: 6000,
            dependencies: ['database-migrations'],
            prompt: '# Mock prompt for data migration',
            expectedOutputs: ['scripts/migrate.ts'],
            verificationCriteria: ['Legacy data imports correctly'],
            tags: ['integration', 'database'],
          },
        },
        testing: {
          unitTests: {
            id: 'testing-unit',
            title: 'Unit Tests',
            description: 'Unit tests for business logic',
            estimatedComplexity: 'Moderate',
            estimatedTokens: 4000,
            dependencies: [],
            prompt: '# Mock prompt for unit tests',
            expectedOutputs: ['src/**/*.test.ts'],
            verificationCriteria: ['All tests pass'],
            tags: ['testing'],
          },
          integrationTests: {
            id: 'testing-integration',
            title: 'Integration Tests',
            description: 'API integration tests',
            estimatedComplexity: 'Complex',
            estimatedTokens: 5000,
            dependencies: ['database-migrations'],
            prompt: '# Mock prompt for integration tests',
            expectedOutputs: ['tests/integration/'],
            verificationCriteria: ['All integration tests pass'],
            tags: ['testing'],
          },
          e2eTests: {
            id: 'testing-e2e',
            title: 'E2E Tests',
            description: 'End-to-end tests with Playwright',
            estimatedComplexity: 'Complex',
            estimatedTokens: 6000,
            dependencies: ['integration-auth'],
            prompt: '# Mock prompt for E2E tests',
            expectedOutputs: ['e2e/'],
            verificationCriteria: ['Critical user flows pass'],
            tags: ['testing'],
          },
        },
      },
      metadata: {
        totalPrompts: 11,
        estimatedImplementationTime: '3-4 weeks',
        implementationOrder: [
          'database-schema',
          'database-migrations',
          'database-seed',
          'integration-auth',
          'integration-authz',
          'integration-api-client',
          'integration-errors',
          'integration-migration',
          'testing-unit',
          'testing-integration',
          'testing-e2e',
        ],
        criticalPathPrompts: ['database-schema', 'integration-auth'],
      },
    };
  }

  const defaultTechStack: TechStackConfig = {
    backend: { framework: 'Node.js + Express', database: 'PostgreSQL', orm: 'Prisma' },
    frontend: { framework: 'React', stateManagement: 'Zustand', uiLibrary: 'Tailwind + shadcn' },
    deployment: { platform: 'Docker', authentication: 'JWT' },
  };

  const finalTechStack: TechStackConfig = {
    backend: { ...defaultTechStack.backend, ...techStack?.backend },
    frontend: { ...defaultTechStack.frontend, ...techStack?.frontend },
    deployment: { ...defaultTechStack.deployment, ...techStack?.deployment },
  };

  let jsonText = '';

  try {
    const criticalModules = phase3Data.modules
      .filter(m => m.priority === 'Critical' || m.priority === 'High')
      .map(m => m.name);

    const userPrompt = `**PRD Summary:**

**Modules:** ${criticalModules.slice(0, 3).join(', ')} (${criticalModules.length} total)

**Entities:** ${phase3Data.dataModel.slice(0, 10).map(e => e.name).join(', ')}${phase3Data.dataModel.length > 10 ? ` +${phase3Data.dataModel.length - 10} more` : ''}

**Tech Stack:** ${finalTechStack.backend.framework}, ${finalTechStack.backend.database}, ${finalTechStack.frontend.framework}

**CRITICAL: Generate ALL 5 sections:**
1. Database: schema, migrations, seed (3 prompts)
2. Backend: ${criticalModules.slice(0, 2).join(', ')} modules (2-3 prompts total)
3. Frontend: ${criticalModules.slice(0, 2).join(', ')} modules (2-3 prompts total)
4. Integration: auth, authz, api, errors, migration (5 prompts)
5. Testing: unit, integration, e2e (3 prompts)

Keep each prompt 800-1200 chars. Return valid Phase4Data JSON.`;

    const response = await callBedrock({
      system: PHASE4_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      max_tokens: 8192, // Claude Sonnet 4.5 maximum output tokens
      temperature: 0.3, // Lower temperature for more consistent JSON structure
    });

    // Parse JSON response
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    } else {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      } else {
        throw new Error('Failed to extract JSON from Phase 4 response');
      }
    }

    // Try to parse as-is first
    try {
      const parsed = JSON.parse(jsonText) as Phase4Data;
      return { ...parsed, generatedAt: new Date().toISOString() };
    } catch (parseError) {
      // If parsing fails, try to repair the JSON
      console.warn('Initial JSON parse failed, attempting to repair...');
      const repaired = repairJSON(jsonText);
      const parsed = JSON.parse(repaired) as Phase4Data;
      return { ...parsed, generatedAt: new Date().toISOString() };
    }
  } catch (error) {
    console.error('Phase 4 AI Error:', error);
    if (error instanceof SyntaxError) {
      console.error('JSON parsing failed. First 1000 chars:', jsonText.substring(0, 1000));
      console.error('Last 1000 chars:', jsonText.substring(Math.max(0, jsonText.length - 1000)));
    }
    throw error;
  }
}
