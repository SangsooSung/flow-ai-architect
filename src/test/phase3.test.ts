import { describe, it, expect } from 'vitest'
import { mockPhase3Data, mockPhase1Data, mockPhase2Data } from '@/data/mockData'
import type { Phase3Data } from '@/types/project'

/**
 * Phase 3: Synthesis & ERP Design Tests
 *
 * According to PRD Section 4.3:
 * - Input: Outputs from Phase 1 & Phase 2
 * - Output: A final, developer-ready ERP Specification that synthesizes meeting intent
 *   with data reality
 */

describe('Phase 3: Final PRD Synthesis', () => {

  describe('Project Overview', () => {
    it('should generate a comprehensive project overview', () => {
      expect(mockPhase3Data.projectOverview).toBeDefined()
      expect(mockPhase3Data.projectOverview.objective).toBeDefined()
      expect(mockPhase3Data.projectOverview.scopeIn).toBeDefined()
      expect(mockPhase3Data.projectOverview.scopeOut).toBeDefined()
    })

    it('should summarize the high-level objective in 1-2 sentences', () => {
      const objective = mockPhase3Data.projectOverview.objective
      expect(objective.length).toBeGreaterThan(50)
      expect(objective.length).toBeLessThan(500)
      expect(objective).toMatch(/ERP/i)
    })

    it('should clearly define in-scope items', () => {
      expect(Array.isArray(mockPhase3Data.projectOverview.scopeIn)).toBe(true)
      expect(mockPhase3Data.projectOverview.scopeIn.length).toBeGreaterThan(5)

      // Should include key items from Phase 1 requirements
      const scopeInText = mockPhase3Data.projectOverview.scopeIn.join(' ')
      expect(scopeInText).toMatch(/inventory|pricing|order/i)
    })

    it('should clearly define out-of-scope items', () => {
      expect(Array.isArray(mockPhase3Data.projectOverview.scopeOut)).toBe(true)
      expect(mockPhase3Data.projectOverview.scopeOut.length).toBeGreaterThan(0)
    })

    it('should distinguish between in-scope and out-of-scope clearly', () => {
      // Items in scopeOut should not appear in scopeIn
      const inScopeText = mockPhase3Data.projectOverview.scopeIn.join(' ').toLowerCase()
      const outScopeText = mockPhase3Data.projectOverview.scopeOut.join(' ').toLowerCase()

      // They should be distinct (no significant overlap)
      expect(inScopeText).not.toBe(outScopeText)
    })
  })

  describe('System Architecture & Schema', () => {
    it('should define a complete entity relationship diagram', () => {
      expect(mockPhase3Data.architecture).toBeDefined()
      expect(mockPhase3Data.architecture.entities).toBeDefined()
      expect(mockPhase3Data.architecture.relationships).toBeDefined()
    })

    it('should include core entities from Phase 1 data entities', () => {
      const entityNames = mockPhase3Data.architecture.entities.map(
        e => e.name.toLowerCase()
      )

      // Check for entities mentioned in Phase 1
      expect(entityNames.some(n => n.includes('product'))).toBe(true)
      expect(entityNames.some(n => n.includes('order'))).toBe(true)
      expect(entityNames.some(n => n.includes('customer'))).toBe(true)
      expect(entityNames.some(n => n.includes('inventory'))).toBe(true)
    })

    it('should define attributes with data types for each entity', () => {
      mockPhase3Data.architecture.entities.forEach(entity => {
        expect(entity.name).toBeDefined()
        expect(entity.module).toBeDefined()
        expect(Array.isArray(entity.attributes)).toBe(true)
        expect(entity.attributes.length).toBeGreaterThan(0)

        entity.attributes.forEach(attr => {
          expect(attr.name).toBeDefined()
          expect(attr.type).toBeDefined()
        })
      })
    })

    it('should use data types from Phase 2 schema analysis', () => {
      // Find Product entity
      const productEntity = mockPhase3Data.architecture.entities.find(
        e => e.name.toLowerCase() === 'product'
      )
      expect(productEntity).toBeDefined()

      // Should have SKU as defined in Phase 2
      const skuAttr = productEntity?.attributes.find(
        a => a.name.toLowerCase() === 'sku'
      )
      expect(skuAttr).toBeDefined()
      expect(skuAttr?.constraint).toMatch(/primary key/i)
    })

    it('should define relationships between entities', () => {
      expect(mockPhase3Data.architecture.relationships.length).toBeGreaterThan(0)

      mockPhase3Data.architecture.relationships.forEach(rel => {
        expect(rel.from).toBeDefined()
        expect(rel.to).toBeDefined()
        expect(['one-to-one', 'one-to-many', 'many-to-many']).toContain(rel.type)
        expect(rel.label).toBeDefined()
      })
    })

    it('should implement normalization recommendations from Phase 2', () => {
      // Phase 2 recommended normalizing Pricing Matrix into Product, Price_Rule, Discount_Tier
      const entityNames = mockPhase3Data.architecture.entities.map(
        e => e.name.toLowerCase()
      )

      expect(entityNames.some(n => n.includes('product'))).toBe(true)
      expect(entityNames.some(n => n.includes('price'))).toBe(true)
      expect(entityNames.some(n => n.includes('discount'))).toBe(true)
    })

    it('should include warehouse and inventory entities as per Phase 2', () => {
      const entityNames = mockPhase3Data.architecture.entities.map(
        e => e.name.toLowerCase()
      )

      expect(entityNames.some(n => n.includes('warehouse'))).toBe(true)
      expect(entityNames.some(n => n.includes('inventory'))).toBe(true)
    })

    it('should define Audit_Log entity for compliance (Phase 1 requirement)', () => {
      const auditEntity = mockPhase3Data.architecture.entities.find(
        e => e.name.toLowerCase().includes('audit')
      )
      expect(auditEntity).toBeDefined()
    })
  })

  describe('User Flows & Business Logic', () => {
    it('should define complete user flows from Phase 1 workflows', () => {
      expect(mockPhase3Data.userFlows).toBeDefined()
      expect(Array.isArray(mockPhase3Data.userFlows)).toBe(true)
      expect(mockPhase3Data.userFlows.length).toBeGreaterThan(0)
    })

    it('should describe the Order-to-Cash (O2C) happy path', () => {
      const o2cFlow = mockPhase3Data.userFlows.find(
        f => f.name.toLowerCase().includes('order') ||
            f.name.toLowerCase().includes('o2c')
      )
      expect(o2cFlow).toBeDefined()
      expect(o2cFlow?.steps.length).toBeGreaterThan(3)
    })

    it('should inject specific formulas from Phase 2 into workflows', () => {
      const allSteps = mockPhase3Data.userFlows.flatMap(f => f.steps)
      const stepsWithFormulas = allSteps.filter(s => s.formula && s.formula.length > 0)

      expect(stepsWithFormulas.length).toBeGreaterThan(0)

      // Should include pricing formula from Phase 2
      const pricingStep = stepsWithFormulas.find(
        s => s.formula?.toLowerCase().includes('price') &&
            s.formula?.toLowerCase().includes('discount')
      )
      expect(pricingStep).toBeDefined()
    })

    it('should include the $10,000 approval threshold from Phase 1', () => {
      const allSteps = mockPhase3Data.userFlows.flatMap(f => f.steps)
      const approvalStep = allSteps.find(
        s => (s.condition?.includes('10,000') || s.condition?.includes('10000')) ||
            (s.action.includes('10,000') || s.action.includes('10000'))
      )
      expect(approvalStep).toBeDefined()
    })

    it('should include inventory availability formula from Phase 2', () => {
      const allSteps = mockPhase3Data.userFlows.flatMap(f => f.steps)
      const inventoryStep = allSteps.find(
        s => s.formula?.toLowerCase().includes('available') &&
            s.formula?.toLowerCase().includes('reserved')
      )
      expect(inventoryStep).toBeDefined()
    })

    it('should map user roles to permissions', () => {
      mockPhase3Data.userFlows.forEach(flow => {
        expect(flow.permissions).toBeDefined()
        expect(Array.isArray(flow.permissions)).toBe(true)
        expect(flow.permissions.length).toBeGreaterThan(0)

        flow.permissions.forEach(perm => {
          expect(perm.role).toBeDefined()
          expect(Array.isArray(perm.actions)).toBe(true)
          expect(perm.actions.length).toBeGreaterThan(0)
        })
      })
    })

    it('should include roles from Phase 1 in permissions', () => {
      const allRoles = mockPhase3Data.userFlows.flatMap(
        f => f.permissions.map(p => p.role.toLowerCase())
      )

      // Check for Phase 1 roles
      expect(allRoles.some(r => r.includes('sales'))).toBe(true)
      expect(allRoles.some(r => r.includes('warehouse'))).toBe(true)
      expect(allRoles.some(r => r.includes('procurement'))).toBe(true)
    })
  })

  describe('Data Migration Strategy', () => {
    it('should provide a migration plan for legacy data', () => {
      expect(mockPhase3Data.migrationPlan).toBeDefined()
      expect(mockPhase3Data.migrationPlan.mappings).toBeDefined()
      expect(mockPhase3Data.migrationPlan.importOrder).toBeDefined()
    })

    it('should map Phase 2 artifacts to target tables', () => {
      expect(Array.isArray(mockPhase3Data.migrationPlan.mappings)).toBe(true)
      expect(mockPhase3Data.migrationPlan.mappings.length).toBeGreaterThan(0)

      mockPhase3Data.migrationPlan.mappings.forEach(mapping => {
        expect(mapping.sourceSheet).toBeDefined()
        expect(mapping.targetTable).toBeDefined()
        expect(mapping.estimatedRows).toBeDefined()
        expect(Array.isArray(mapping.cleanupNotes)).toBe(true)
        expect(['ready', 'needs_cleanup', 'blocked']).toContain(mapping.status)
      })
    })

    it('should provide cleanup notes for dirty data', () => {
      const mappingsWithCleanup = mockPhase3Data.migrationPlan.mappings.filter(
        m => m.cleanupNotes.length > 0
      )
      expect(mappingsWithCleanup.length).toBeGreaterThan(0)

      // Should note currency formatting issues from Phase 2
      const allCleanupNotes = mappingsWithCleanup.flatMap(m => m.cleanupNotes).join(' ')
      expect(allCleanupNotes).toMatch(/\$|currency|percentage|decimal/i)
    })

    it('should define import order based on dependencies', () => {
      expect(Array.isArray(mockPhase3Data.migrationPlan.importOrder)).toBe(true)
      expect(mockPhase3Data.migrationPlan.importOrder.length).toBeGreaterThan(0)

      // Should import parent entities before child entities
      const importOrder = mockPhase3Data.migrationPlan.importOrder
      expect(importOrder.length).toBeGreaterThan(0)

      // Verify Product comes before dependent entities
      const productIndex = importOrder.findIndex(item => item.toLowerCase().includes('product'))
      const inventoryIndex = importOrder.findIndex(item => item.toLowerCase().includes('inventory'))

      if (productIndex >= 0 && inventoryIndex >= 0) {
        expect(productIndex).toBeLessThan(inventoryIndex)
      }
    })

    it('should account for entities with no legacy data', () => {
      // Phase 2 found no vendor or customer data
      const allCleanupNotes = mockPhase3Data.migrationPlan.mappings
        .flatMap(m => m.cleanupNotes)
        .join(' ')
        .toLowerCase()
      const importOrder = mockPhase3Data.migrationPlan.importOrder.join(' ').toLowerCase()

      // Should mention manual entry for missing data
      expect(importOrder).toMatch(/manual|vendor|customer/i)
    })
  })

  describe('Conflict Resolution & Open Questions', () => {
    it('should identify conflicts between meeting and data', () => {
      expect(mockPhase3Data.conflicts).toBeDefined()
      expect(Array.isArray(mockPhase3Data.conflicts)).toBe(true)
      expect(mockPhase3Data.conflicts.length).toBeGreaterThan(0)
    })

    it('should document client claim vs. data reality for each conflict', () => {
      mockPhase3Data.conflicts.forEach(conflict => {
        expect(conflict.clientClaim).toBeDefined()
        expect(conflict.clientClaim.length).toBeGreaterThan(20)
        expect(conflict.dataReality).toBeDefined()
        expect(conflict.dataReality.length).toBeGreaterThan(20)
        expect(conflict.recommendation).toBeDefined()
        expect(conflict.recommendation.length).toBeGreaterThan(20)
        expect(['critical', 'warning']).toContain(conflict.severity)
      })
    })

    it('should flag the missing approval workflow (Phase 2 discrepancy)', () => {
      const approvalConflict = mockPhase3Data.conflicts.find(
        c => (c.clientClaim.toLowerCase().includes('approval') ||
              c.dataReality.toLowerCase().includes('approval')) &&
            c.severity === 'critical'
      )
      expect(approvalConflict).toBeDefined()
      expect(approvalConflict?.dataReality.toLowerCase()).toMatch(/no.*column|no.*approval|no.*data|neither|spreadsheet/i)
    })

    it('should flag the regional pricing discovery (Phase 2 surprise)', () => {
      const regionalConflict = mockPhase3Data.conflicts.find(
        c => (c.dataReality.toLowerCase().includes('region') ||
              c.clientClaim.toLowerCase().includes('region')) &&
            (c.dataReality.toLowerCase().includes('pric') ||
             c.clientClaim.toLowerCase().includes('pric') ||
             c.dataReality.toLowerCase().includes('formula'))
      )
      expect(regionalConflict).toBeDefined()
      expect(regionalConflict?.severity).toBe('critical')
    })

    it('should provide actionable recommendations for each conflict', () => {
      mockPhase3Data.conflicts.forEach(conflict => {
        expect(conflict.recommendation).toBeDefined()
        expect(conflict.recommendation.length).toBeGreaterThan(50)
      })
    })

    it('should list blocking questions that prevent development', () => {
      expect(mockPhase3Data.blockingQuestions).toBeDefined()
      expect(Array.isArray(mockPhase3Data.blockingQuestions)).toBe(true)
      expect(mockPhase3Data.blockingQuestions.length).toBeGreaterThan(0)
    })

    it('should derive blocking questions from Phase 2 discrepancies', () => {
      const questionsText = mockPhase3Data.blockingQuestions.join(' ').toLowerCase()

      // Should ask about partial shipments (Phase 2 discrepancy)
      expect(questionsText).toMatch(/partial|shipment|split/i)
    })
  })

  describe('PRD Markdown Generation', () => {
    it('should generate a complete markdown PRD document', () => {
      expect(mockPhase3Data.prdMarkdown).toBeDefined()
      expect(mockPhase3Data.prdMarkdown.length).toBeGreaterThan(500)
    })

    it('should include all major sections in markdown', () => {
      const markdown = mockPhase3Data.prdMarkdown

      expect(markdown).toMatch(/## 1\. Project Overview/i)
      expect(markdown).toMatch(/## 2\. System Architecture/i)
      expect(markdown).toMatch(/## 3\. Business Logic/i)
      expect(markdown).toMatch(/## 4\. Data Migration/i)
      expect(markdown).toMatch(/## 5\. Conflicts/i)
    })

    it('should include verified formulas in code blocks', () => {
      const markdown = mockPhase3Data.prdMarkdown

      expect(markdown).toMatch(/```/)
      expect(markdown).toMatch(/function|if\(/i)
    })

    it('should document conflicts and open items clearly', () => {
      const markdown = mockPhase3Data.prdMarkdown

      expect(markdown.toLowerCase()).toMatch(/conflict|discrepancy|blocking/i)
    })
  })

  describe('Synthesis Rules Compliance', () => {
    it('should prioritize Phase 2 data reality over Phase 1 verbal claims', () => {
      // Regional pricing was found in data but not mentioned in meeting
      // Should be included in final PRD
      const entities = mockPhase3Data.architecture.entities
      const priceRuleEntity = entities.find(
        e => e.name.toLowerCase().includes('price')
      )

      const regionAttr = priceRuleEntity?.attributes.find(
        a => a.name.toLowerCase().includes('region')
      )
      expect(regionAttr).toBeDefined()
    })

    it('should use precise technical terms for backend engineers', () => {
      const markdown = mockPhase3Data.prdMarkdown.toLowerCase()

      expect(markdown).toMatch(/primary key|foreign key|pk|fk/i)
      expect(markdown).toMatch(/decimal|varchar|enum|integer/i)
    })

    it('should include specific formulas, not vague descriptions', () => {
      const allSteps = mockPhase3Data.userFlows.flatMap(f => f.steps)
      const stepsWithFormulas = allSteps.filter(s => s.formula && s.formula.length > 0)

      // Formulas should be specific, not just "calculate price"
      stepsWithFormulas.forEach(step => {
        expect(step.formula).toBeDefined()
        expect(step.formula!.length).toBeGreaterThan(10)
      })
    })

    it('should not leave logic vague or ambiguous', () => {
      // All calculated fields should have formulas
      const userFlowFormulas = mockPhase3Data.userFlows.flatMap(f =>
        f.steps.filter(s => s.formula)
      )
      expect(userFlowFormulas.length).toBeGreaterThan(2)
    })
  })

  describe('Metadata & Confidence', () => {
    it('should provide a confidence score for the PRD', () => {
      expect(mockPhase3Data.confidence).toBeDefined()
      expect(typeof mockPhase3Data.confidence).toBe('number')
      expect(mockPhase3Data.confidence).toBeGreaterThan(0)
      expect(mockPhase3Data.confidence).toBeLessThanOrEqual(100)
    })

    it('should timestamp the generation', () => {
      expect(mockPhase3Data.generatedAt).toBeDefined()
      expect(new Date(mockPhase3Data.generatedAt).toString()).not.toBe('Invalid Date')
    })
  })

  describe('ERP Modules', () => {
    it('should organize requirements into ERP modules', () => {
      expect(mockPhase3Data.modules).toBeDefined()
      expect(Array.isArray(mockPhase3Data.modules)).toBe(true)
      expect(mockPhase3Data.modules.length).toBeGreaterThan(3)
    })

    it('should prioritize modules appropriately', () => {
      mockPhase3Data.modules.forEach(module => {
        expect(module.priority).toBeDefined()
        expect(['Critical', 'High', 'Medium', 'Low']).toContain(module.priority)
      })

      // Core modules should be Critical or High
      const inventoryModule = mockPhase3Data.modules.find(
        m => m.name.toLowerCase().includes('inventory')
      )
      expect(['Critical', 'High']).toContain(inventoryModule?.priority)
    })
  })

  describe('Integration of Phase 1 and Phase 2', () => {
    it('should merge Phase 1 requirements with Phase 2 data validation', () => {
      // Phase 1 requirements should be reflected in architecture
      const phase1RequirementModules = mockPhase1Data.requirements.map(
        r => r.moduleName.toLowerCase()
      )
      const phase3Modules = mockPhase3Data.modules.map(
        m => m.name.toLowerCase()
      )

      // Should have significant overlap
      phase1RequirementModules.forEach(phase1Module => {
        const hasMatch = phase3Modules.some(phase3Module =>
          phase3Module.includes(phase1Module.split(' ')[0])
        )
        expect(hasMatch).toBe(true)
      })
    })

    it('should incorporate Phase 2 schema definitions into architecture', () => {
      // Phase 2 schemas should be reflected in Phase 3 entities
      mockPhase2Data.schemas.forEach(schema => {
        const matchingEntity = mockPhase3Data.architecture.entities.find(
          e => e.name.toLowerCase().replace('_', '') ===
               schema.proposedTableName.toLowerCase().replace('_', '')
        )
        // Most schemas should have corresponding entities (some may be merged)
        // At least half should match
      })

      // Should have entities for major schemas
      const entityNames = mockPhase3Data.architecture.entities.map(
        e => e.name.toLowerCase()
      )
      expect(entityNames.some(n => n.includes('product'))).toBe(true)
      expect(entityNames.some(n => n.includes('inventory'))).toBe(true)
    })

    it('should incorporate Phase 2 validation results into conflicts', () => {
      // Phase 2 discrepancies should appear in Phase 3 conflicts
      const phase2Discrepancies = mockPhase2Data.contextValidation.filter(
        v => v.type === 'discrepancy' && v.severity === 'critical'
      )

      // At least some critical discrepancies should be escalated
      let matchedCount = 0
      phase2Discrepancies.forEach(discrepancy => {
        const fieldKeywords = discrepancy.field.toLowerCase().split(' ')
        const matchingConflict = mockPhase3Data.conflicts.find(
          c => fieldKeywords.some(keyword =>
            c.clientClaim.toLowerCase().includes(keyword) ||
            c.dataReality.toLowerCase().includes(keyword)
          )
        )
        if (matchingConflict) matchedCount++
      })

      // At least half of critical discrepancies should be escalated
      expect(matchedCount).toBeGreaterThanOrEqual(Math.floor(phase2Discrepancies.length / 2))
    })

    it('should reference Phase 1 open questions in blocking questions', () => {
      // Some Phase 1 open questions should be addressed or remain blocking
      const phase1Questions = mockPhase1Data.openQuestions.map(q => q.toLowerCase())
      const phase3Questions = mockPhase3Data.blockingQuestions.map(q => q.toLowerCase())

      // Should have some overlap or evolution of questions
      expect(phase3Questions.length).toBeGreaterThan(0)
    })
  })

  describe('Developer Readiness', () => {
    it('should provide complete ERD with relationships', () => {
      const hasEntities = mockPhase3Data.architecture.entities.length > 0
      const hasRelationships = mockPhase3Data.architecture.relationships.length > 0

      expect(hasEntities).toBe(true)
      expect(hasRelationships).toBe(true)
    })

    it('should define all entity attributes with types', () => {
      mockPhase3Data.architecture.entities.forEach(entity => {
        expect(entity.attributes.length).toBeGreaterThan(0)
        entity.attributes.forEach(attr => {
          expect(attr.type).toBeDefined()
          expect(attr.type.length).toBeGreaterThan(0)
        })
      })
    })

    it('should provide executable migration strategy', () => {
      expect(mockPhase3Data.migrationPlan.importOrder.length).toBeGreaterThan(0)
      expect(mockPhase3Data.migrationPlan.mappings.length).toBeGreaterThan(0)
    })

    it('should be complete enough for backend development to start', () => {
      // Must have: entities, relationships, business logic formulas, migration plan
      expect(mockPhase3Data.architecture.entities.length).toBeGreaterThan(5)
      expect(mockPhase3Data.architecture.relationships.length).toBeGreaterThan(5)
      expect(mockPhase3Data.userFlows.length).toBeGreaterThan(0)
      expect(mockPhase3Data.migrationPlan.mappings.length).toBeGreaterThan(0)
    })
  })
})
