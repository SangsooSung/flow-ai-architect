import type { Phase3Data } from '@/types/project';

/**
 * Generates a comprehensive PRD markdown document from Phase 3 structured data.
 * This replaces the truncated 1000-character AI-generated prdMarkdown with a
 * complete, well-formatted specification document.
 */
export function generateFullPRD(data: Phase3Data): string {
  const sections: string[] = [];

  // 1. Header
  sections.push(`# Product Requirements Document`);
  sections.push(`\nGenerated: ${new Date(data.generatedAt).toLocaleDateString()}`);
  sections.push(`\n---\n`);

  // 2. Project Overview
  sections.push(`## Project Overview\n`);
  sections.push(`**Objective:** ${data.projectOverview.objective}\n`);

  if (data.projectOverview.scopeIn.length > 0) {
    sections.push(`**In Scope:**`);
    data.projectOverview.scopeIn.forEach(item => {
      sections.push(`- ${item}`);
    });
    sections.push(``);
  }

  if (data.projectOverview.scopeOut.length > 0) {
    sections.push(`**Out of Scope:**`);
    data.projectOverview.scopeOut.forEach(item => {
      sections.push(`- ${item}`);
    });
    sections.push(``);
  }
  sections.push(`\n---\n`);

  // 3. ERP Modules
  if (data.modules.length > 0) {
    sections.push(`## ERP Modules\n`);
    data.modules.forEach(module => {
      sections.push(`### ${module.name}`);
      sections.push(`${module.description}`);
      sections.push(`**Priority:** ${module.priority}\n`);
      sections.push(`**Requirements:**`);
      module.requirements.forEach(req => sections.push(`- ${req}`));
      sections.push(``);
    });
    sections.push(`\n---\n`);
  }

  // 4. Database Architecture
  sections.push(`## Database Architecture\n`);

  if (data.architecture.entities.length > 0) {
    sections.push(`### Entities (${data.architecture.entities.length})\n`);
    data.architecture.entities.forEach(entity => {
      sections.push(`#### ${entity.name}`);
      sections.push(`**Module:** ${entity.module}\n`);
      sections.push(`**Attributes:**`);
      entity.attributes.forEach(attr => {
        const constraint = attr.constraint ? ` [${attr.constraint}]` : '';
        sections.push(`- \`${attr.name}\` (${attr.type})${constraint}`);
      });
      sections.push(``);
    });
  }

  if (data.architecture.relationships.length > 0) {
    sections.push(`### Relationships\n`);
    data.architecture.relationships.forEach(rel => {
      sections.push(`- **${rel.from}** → **${rel.to}** (${rel.type}): ${rel.label}`);
    });
    sections.push(``);
  }

  sections.push(`\n---\n`);

  // 5. User Flows
  if (data.userFlows.length > 0) {
    sections.push(`## Key User Flows\n`);
    data.userFlows.forEach((flow, idx) => {
      sections.push(`### ${idx + 1}. ${flow.name}`);
      sections.push(`${flow.description}\n`);

      sections.push(`**Steps:**`);
      flow.steps.forEach((step) => {
        const condition = step.condition ? ` (if ${step.condition})` : '';
        const formula = step.formula ? ` [Formula: ${step.formula}]` : '';
        sections.push(`${step.step}. **${step.actor}**: ${step.action}${condition}${formula}`);
      });
      sections.push(``);

      if (flow.permissions.length > 0) {
        sections.push(`**Permissions:**`);
        flow.permissions.forEach(perm => {
          sections.push(`- **${perm.role}**: ${perm.actions.join(', ')}`);
        });
        sections.push(``);
      }
    });
    sections.push(`\n---\n`);
  }

  // 6. Data Model
  if (data.dataModel.length > 0) {
    sections.push(`## Data Model Entities\n`);
    data.dataModel.forEach(entity => {
      sections.push(`### ${entity.name}\n`);
      sections.push(`**Fields:**`);
      entity.fields.forEach(field => {
        const required = field.required ? ' (required)' : ' (optional)';
        sections.push(`- \`${field.name}\` (${field.type})${required}`);
      });
      sections.push(``);

      if (entity.relationships.length > 0) {
        sections.push(`**Relationships:**`);
        entity.relationships.forEach(rel => {
          sections.push(`- ${rel}`);
        });
        sections.push(``);
      }
    });
    sections.push(`\n---\n`);
  }

  // 7. Migration Plan
  sections.push(`## Migration Strategy\n`);

  if (data.migrationPlan.importOrder.length > 0) {
    sections.push(`**Import Order:**`);
    data.migrationPlan.importOrder.forEach((table, idx) => {
      sections.push(`${idx + 1}. ${table}`);
    });
    sections.push(``);
  }

  if (data.migrationPlan.mappings.length > 0) {
    sections.push(`### Migration Mappings\n`);
    data.migrationPlan.mappings.forEach(mapping => {
      sections.push(`#### ${mapping.sourceSheet} → ${mapping.targetTable}`);
      sections.push(`**Status:** ${mapping.status}`);
      sections.push(`**Estimated Rows:** ${mapping.estimatedRows}\n`);

      if (mapping.cleanupNotes.length > 0) {
        sections.push(`**Cleanup Notes:**`);
        mapping.cleanupNotes.forEach(note => {
          sections.push(`- ${note}`);
        });
      }
      sections.push(``);
    });
  }

  sections.push(`\n---\n`);

  // 8. Conflicts & Resolutions
  if (data.conflicts.length > 0) {
    sections.push(`## Conflicts & Open Items\n`);

    const criticalConflicts = data.conflicts.filter(c => c.severity === 'critical');
    const warningConflicts = data.conflicts.filter(c => c.severity === 'warning');

    if (criticalConflicts.length > 0) {
      sections.push(`### Critical Issues (${criticalConflicts.length})\n`);
      criticalConflicts.forEach((conflict, idx) => {
        const status = conflict.resolved ? '✓ Resolved' : '⚠️ Open';
        sections.push(`${idx + 1}. **${status}** - ${conflict.id}`);
        sections.push(`   - **Client Claim:** ${conflict.clientClaim}`);
        sections.push(`   - **Data Reality:** ${conflict.dataReality}`);
        sections.push(`   - **Recommendation:** ${conflict.recommendation}`);
        sections.push(``);
      });
    }

    if (warningConflicts.length > 0) {
      sections.push(`### Warnings (${warningConflicts.length})\n`);
      warningConflicts.forEach((conflict, idx) => {
        const status = conflict.resolved ? '✓ Resolved' : '⚠️ Open';
        sections.push(`${idx + 1}. **${status}** - ${conflict.id}`);
        sections.push(`   - **Client Claim:** ${conflict.clientClaim}`);
        sections.push(`   - **Data Reality:** ${conflict.dataReality}`);
        sections.push(`   - **Recommendation:** ${conflict.recommendation}`);
        sections.push(``);
      });
    }
  }

  if (data.blockingQuestions.length > 0) {
    sections.push(`### Blocking Questions\n`);
    data.blockingQuestions.forEach((question, idx) => {
      sections.push(`${idx + 1}. ${question}`);
    });
    sections.push(``);
  }

  sections.push(`\n---\n`);

  // 9. Confidence & Metadata
  sections.push(`## Analysis Metadata\n`);
  sections.push(`- **Confidence Score:** ${data.confidence}%`);
  sections.push(`- **Critical Conflicts:** ${data.conflicts.filter(c => c.severity === 'critical').length}`);
  sections.push(`- **Warning Conflicts:** ${data.conflicts.filter(c => c.severity === 'warning').length}`);
  sections.push(`- **Total Entities:** ${data.architecture.entities.length}`);
  sections.push(`- **User Flows Identified:** ${data.userFlows.length}`);
  sections.push(`- **Data Model Entities:** ${data.dataModel.length}`);
  sections.push(`- **ERP Modules:** ${data.modules.length}`);
  sections.push(`- **Migration Mappings:** ${data.migrationPlan.mappings.length}`);
  sections.push(`- **Blocking Questions:** ${data.blockingQuestions.length}`);

  return sections.join('\n');
}
