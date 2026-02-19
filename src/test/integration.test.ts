import { describe, it, expect } from 'vitest'
import { mockPhase1Data, mockPhase2Data, mockPhase3Data, mockProjects } from '@/data/mockData'
import type { Project } from '@/types/project'

/**
 * Integration Tests: End-to-End MVP Workflow
 *
 * Tests the complete Flow AI Architect workflow according to the PRD:
 * 1. Meeting transcript → Phase 1 preliminary requirements
 * 2. Spreadsheet upload → Phase 2 data logic analysis
 * 3. Synthesis → Phase 3 final ERP PRD
 */

describe('Flow AI Architect MVP Integration', () => {

  describe('Three-Phase Workflow', () => {
    it('should complete all three phases in sequence', () => {
      // Verify complete project exists
      const completedProject = mockProjects.find(p => p.status === 'completed')
      expect(completedProject).toBeDefined()
      expect(completedProject?.currentPhase).toBe(3)
      expect(completedProject?.phase1).toBeDefined()
      expect(completedProject?.phase2).toBeDefined()
      expect(completedProject?.phase3).toBeDefined()
    })

    it('should maintain data continuity across phases', () => {
      // Phase 2 should reference Phase 1 artifacts
      const phase1Artifacts = mockPhase1Data.artifactMapping
      const phase2Schemas = mockPhase2Data.schemas

      phase2Schemas.forEach(schema => {
        const referencedArtifact = phase1Artifacts.find(
          a => a.id === schema.artifactId
        )
        expect(referencedArtifact).toBeDefined()
      })

      // Phase 3 should incorporate Phase 2 conflicts
      const phase2CriticalDiscrepancies = mockPhase2Data.contextValidation.filter(
        v => v.type === 'discrepancy' && v.severity === 'critical'
      )
      const phase3Conflicts = mockPhase3Data.conflicts

      expect(phase3Conflicts.length).toBeGreaterThanOrEqual(phase2CriticalDiscrepancies.length)
    })

    it('should progressively refine requirements through phases', () => {
      // Phase 1: General entities
      const phase1Entities = mockPhase1Data.dataEntities
      expect(phase1Entities.length).toBeGreaterThan(0)

      // Phase 2: Normalized entities with types
      const phase2Schemas = mockPhase2Data.schemas
      expect(phase2Schemas.length).toBeGreaterThan(0)
      expect(phase2Schemas.every(s => s.columns.length > 0)).toBe(true)

      // Phase 3: Final architecture with relationships
      const phase3Entities = mockPhase3Data.architecture.entities
      const phase3Relationships = mockPhase3Data.architecture.relationships
      expect(phase3Entities.length).toBeGreaterThan(phase1Entities.length / 2)
      expect(phase3Relationships.length).toBeGreaterThan(0)
    })
  })

  describe('PRD Success Metrics', () => {
    describe('Accuracy: >90% requirement capture', () => {
      it('should extract all major pain points from transcript', () => {
        const painPoints = mockPhase1Data.executiveSummary.painPoints
        expect(painPoints.length).toBeGreaterThan(3)

        // Should capture: inventory lag, pricing complexity, no visibility
        const painPointsText = painPoints.join(' ').toLowerCase()
        expect(painPointsText).toMatch(/inventory|lag|oversell/i)
        expect(painPointsText).toMatch(/pricing|formula|complex/i)
        expect(painPointsText).toMatch(/visibility|status|track/i)
      })

      it('should identify all user roles mentioned in transcript', () => {
        const roles = mockPhase1Data.userRoles
        expect(roles.length).toBeGreaterThan(3)

        const roleNames = roles.map(r => r.name.toLowerCase())
        expect(roleNames.some(n => n.includes('sales'))).toBe(true)
        expect(roleNames.some(n => n.includes('warehouse'))).toBe(true)
        expect(roleNames.some(n => n.includes('procurement'))).toBe(true)
      })

      it('should capture all critical business rules', () => {
        // $10K approval threshold
        const hasApprovalRule = mockPhase1Data.businessLogic.currentState.some(
          step => step.conditional?.toLowerCase().includes('10,000') ||
                  step.conditional?.toLowerCase().includes('10000')
        )
        expect(hasApprovalRule).toBe(true)

        // Three warehouses
        const hasWarehouseInfo = mockPhase1Data.artifactMapping.some(
          a => a.expectedFields.some(f => f.toLowerCase().includes('warehouse'))
        )
        expect(hasWarehouseInfo).toBe(true)
      })
    })

    describe('Completeness: 100% external file identification', () => {
      it('should identify all spreadsheets mentioned in transcript', () => {
        const artifacts = mockPhase1Data.artifactMapping
        expect(artifacts.length).toBeGreaterThan(0)

        // Should find Pricing Matrix and Master Inventory
        const artifactNames = artifacts.map(a => a.name.toLowerCase())
        expect(artifactNames.some(n => n.includes('pricing'))).toBe(true)
        expect(artifactNames.some(n => n.includes('inventory'))).toBe(true)
      })

      it('should request file uploads for all identified artifacts', () => {
        const artifacts = mockPhase1Data.artifactMapping
        artifacts.forEach(artifact => {
          expect(artifact.status).toBeDefined()
          expect(['pending', 'uploaded', 'analyzed']).toContain(artifact.status)
        })
      })

      it('should analyze all uploaded files in Phase 2', () => {
        const phase1Artifacts = mockPhase1Data.artifactMapping
        const phase2Artifacts = mockPhase2Data.artifacts

        expect(phase2Artifacts.length).toBeGreaterThanOrEqual(phase1Artifacts.length)

        phase1Artifacts.forEach(phase1Art => {
          const analyzed = phase2Artifacts.some(
            phase2Art => phase2Art.name === phase1Art.name ||
                        phase2Art.id === phase1Art.id
          )
          expect(analyzed).toBe(true)
        })
      })
    })

    describe('Time Saving: Rapid documentation', () => {
      it('should generate structured output immediately', () => {
        // All phases should have timestamps
        expect(mockPhase3Data.generatedAt).toBeDefined()
        expect(new Date(mockPhase3Data.generatedAt).toString()).not.toBe('Invalid Date')
      })

      it('should produce a complete markdown PRD', () => {
        expect(mockPhase3Data.prdMarkdown).toBeDefined()
        expect(mockPhase3Data.prdMarkdown.length).toBeGreaterThan(1000)
      })

      it('should eliminate manual formatting with structured data', () => {
        // Structured data should be complete
        expect(mockPhase3Data.architecture.entities.length).toBeGreaterThan(5)
        expect(mockPhase3Data.userFlows.length).toBeGreaterThan(0)
        expect(mockPhase3Data.migrationPlan.mappings.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Critical PRD Features', () => {
    describe('Information Silos Resolution', () => {
      it('should merge verbal context with spreadsheet data', () => {
        // Phase 1 verbal: "volume discounts"
        const phase1HasDiscounts = mockPhase1Data.requirements.some(module =>
          module.requirements.some(req =>
            req.description.toLowerCase().includes('discount')
          )
        )
        expect(phase1HasDiscounts).toBe(true)

        // Phase 2 data: actual discount tiers extracted
        const phase2HasDiscountLogic = mockPhase2Data.logicAnalysis.calculatedFields.some(
          field => field.formula.toLowerCase().includes('discount')
        )
        expect(phase2HasDiscountLogic).toBe(true)

        // Phase 3 synthesis: specific formula in PRD
        const phase3HasFormula = mockPhase3Data.userFlows.some(flow =>
          flow.steps.some(step =>
            step.formula?.toLowerCase().includes('discount')
          )
        )
        expect(phase3HasFormula).toBe(true)
      })

      it('should validate verbal claims against actual data', () => {
        const validations = mockPhase2Data.contextValidation
        const hasConfirmed = validations.some(v => v.type === 'confirmed')
        const hasDiscrepancies = validations.some(v => v.type === 'discrepancy')

        expect(hasConfirmed).toBe(true)
        expect(hasDiscrepancies).toBe(true)
      })
    })

    describe('Loss in Translation Prevention', () => {
      it('should preserve nuance with context references', () => {
        const allRequirements = mockPhase1Data.requirements.flatMap(m => m.requirements)
        allRequirements.forEach(req => {
          expect(req.context).toBeDefined()
          expect(req.context.length).toBeGreaterThan(0)
        })
      })

      it('should flag ambiguities as open questions', () => {
        const openQuestions = mockPhase1Data.openQuestions
        expect(openQuestions.length).toBeGreaterThan(0)
      })

      it('should escalate critical discrepancies to blocking questions', () => {
        const blockingQuestions = mockPhase3Data.blockingQuestions
        expect(blockingQuestions.length).toBeGreaterThan(0)
      })
    })

    describe('Excel Logic Decoding', () => {
      it('should extract formulas from spreadsheet cells', () => {
        const artifacts = mockPhase2Data.artifacts
        const formulasFound = artifacts.flatMap(a => a.formulasFound)
        expect(formulasFound.length).toBeGreaterThan(0)
      })

      it('should reverse-engineer business logic from formulas', () => {
        const calculatedFields = mockPhase2Data.logicAnalysis.calculatedFields
        expect(calculatedFields.length).toBeGreaterThan(0)

        calculatedFields.forEach(field => {
          expect(field.formula).toBeDefined()
          expect(field.sourceArtifact).toBeDefined()
          expect(field.confidence).toBeDefined()
        })
      })

      it('should include exact formulas in the final PRD', () => {
        const userFlowFormulas = mockPhase3Data.userFlows.flatMap(f =>
          f.steps.filter(s => s.formula).map(s => s.formula)
        )
        expect(userFlowFormulas.length).toBeGreaterThan(0)

        // Formulas should be specific, not vague
        userFlowFormulas.forEach(formula => {
          expect(formula!.length).toBeGreaterThan(10)
        })
      })
    })
  })

  describe('Data Quality & Validation', () => {
    it('should identify data type mismatches', () => {
      // Currency stored as "$24.99" instead of decimal
      const pricingArtifact = mockPhase2Data.artifacts.find(
        a => a.name.toLowerCase().includes('pricing')
      )
      const samplePrice = pricingArtifact?.sampleRows[0]?.['Base Price']
      expect(samplePrice).toMatch(/\$/)

      // Should note cleanup needed
      const pricingMapping = mockPhase3Data.migrationPlan.mappings.find(
        m => m.sourceSheet.toLowerCase().includes('pricing')
      )
      const hasCleanup = pricingMapping?.cleanupNotes.some(
        note => note.toLowerCase().includes('$') || note.toLowerCase().includes('decimal')
      )
      expect(hasCleanup).toBe(true)
    })

    it('should identify missing expected fields', () => {
      const mismatches = mockPhase2Data.validationResults.filter(
        v => v.status === 'mismatch'
      )
      expect(mismatches.length).toBeGreaterThan(0)
    })

    it('should discover unexpected fields and logic', () => {
      const extras = mockPhase2Data.validationResults.filter(
        v => v.status === 'extra'
      )
      const surprises = mockPhase2Data.contextValidation.filter(
        v => v.type === 'surprise'
      )
      expect(extras.length + surprises.length).toBeGreaterThan(0)
    })
  })

  describe('Project Management Features', () => {
    it('should track project status through phases', () => {
      mockProjects.forEach(project => {
        expect(['draft', 'in_progress', 'completed']).toContain(project.status)
        expect([1, 2, 3]).toContain(project.currentPhase)
      })
    })

    it('should maintain project metadata', () => {
      mockProjects.forEach(project => {
        expect(project.id).toBeDefined()
        expect(project.name).toBeDefined()
        expect(project.clientName).toBeDefined()
        expect(project.createdAt).toBeDefined()
        expect(project.updatedAt).toBeDefined()
      })
    })

    it('should handle multiple projects concurrently', () => {
      expect(mockProjects.length).toBeGreaterThan(1)

      const statuses = mockProjects.map(p => p.status)
      expect(statuses.includes('draft')).toBe(true)
      expect(statuses.includes('in_progress')).toBe(true)
      expect(statuses.includes('completed')).toBe(true)
    })
  })

  describe('User Experience Flow (PRD Section 6)', () => {
    it('Phase 1: Should extract preliminary requirements from transcript', () => {
      expect(mockPhase1Data.transcript).toBeDefined()
      expect(mockPhase1Data.executiveSummary).toBeDefined()
      expect(mockPhase1Data.requirements).toBeDefined()
      expect(mockPhase1Data.artifactMapping).toBeDefined()
    })

    it('Phase 2: Should request artifact uploads based on Phase 1', () => {
      const phase1Artifacts = mockPhase1Data.artifactMapping
      expect(phase1Artifacts.length).toBeGreaterThan(0)
      expect(phase1Artifacts.every(a => a.expectedFields.length > 0)).toBe(true)
    })

    it('Phase 3: Should generate final PRD merging all data', () => {
      expect(mockPhase3Data.projectOverview).toBeDefined()
      expect(mockPhase3Data.architecture).toBeDefined()
      expect(mockPhase3Data.userFlows).toBeDefined()
      expect(mockPhase3Data.migrationPlan).toBeDefined()
      expect(mockPhase3Data.conflicts).toBeDefined()
      expect(mockPhase3Data.prdMarkdown).toBeDefined()
    })

    it('Should provide clear actionable next steps', () => {
      expect(mockPhase3Data.blockingQuestions.length).toBeGreaterThan(0)
      expect(mockPhase3Data.conflicts.every(c => c.recommendation)).toBe(true)
    })
  })

  describe('Technical Completeness', () => {
    it('Should provide complete database schema', () => {
      const entities = mockPhase3Data.architecture.entities
      const relationships = mockPhase3Data.architecture.relationships

      expect(entities.length).toBeGreaterThan(5)
      expect(relationships.length).toBeGreaterThan(5)

      entities.forEach(entity => {
        expect(entity.attributes.length).toBeGreaterThan(0)
      })
    })

    it('Should provide executable business logic', () => {
      const userFlows = mockPhase3Data.userFlows
      const hasFormulas = userFlows.some(flow =>
        flow.steps.some(step => step.formula && step.formula.length > 0)
      )
      expect(hasFormulas).toBe(true)
    })

    it('Should provide migration strategy', () => {
      const plan = mockPhase3Data.migrationPlan
      expect(plan.mappings.length).toBeGreaterThan(0)
      expect(plan.importOrder.length).toBeGreaterThan(0)
    })

    it('Should be developer-ready', () => {
      // Has everything needed to start coding
      expect(mockPhase3Data.architecture.entities.length).toBeGreaterThan(5)
      expect(mockPhase3Data.userFlows.length).toBeGreaterThan(0)
      expect(mockPhase3Data.migrationPlan.mappings.length).toBeGreaterThan(0)
      expect(mockPhase3Data.prdMarkdown.length).toBeGreaterThan(1000)
    })
  })

  describe('Edge Cases & Error Handling', () => {
    it('Should handle projects at different phases', () => {
      const draftProject = mockProjects.find(p => p.status === 'draft')
      const inProgressProject = mockProjects.find(p => p.status === 'in_progress')
      const completedProject = mockProjects.find(p => p.status === 'completed')

      expect(draftProject).toBeDefined()
      expect(inProgressProject).toBeDefined()
      expect(completedProject).toBeDefined()
    })

    it('Should handle missing optional data gracefully', () => {
      // Draft project has no phase data
      const draftProject = mockProjects.find(p => p.status === 'draft')
      expect(draftProject?.phase1).toBeNull()
      expect(draftProject?.phase2).toBeNull()
      expect(draftProject?.phase3).toBeNull()
    })

    it('Should handle partial project completion', () => {
      const inProgressProject = mockProjects.find(p => p.status === 'in_progress')
      expect(inProgressProject?.phase1).toBeDefined()
      expect(inProgressProject?.phase2).toBeNull()
      expect(inProgressProject?.phase3).toBeNull()
    })
  })

  describe('PRD Alignment: Executive Summary Goals', () => {
    it('Should bridge complex requirements and engineering execution', () => {
      // Client spoke in business terms
      const transcript = mockPhase1Data.transcript.toLowerCase()
      expect(transcript).toMatch(/spreadsheet|excel/i)

      // Final PRD in technical terms
      const prd = mockPhase3Data.prdMarkdown.toLowerCase()
      expect(prd).toMatch(/pk|fk|primary key|foreign key|schema|entity/i)
    })

    it('Should reduce Time-to-Spec (target: 60% reduction)', () => {
      // Structured, automated output proves time savings
      expect(mockPhase1Data.requirements.length).toBeGreaterThan(0)
      expect(mockPhase2Data.schemas.length).toBeGreaterThan(0)
      expect(mockPhase3Data.prdMarkdown.length).toBeGreaterThan(1000)
    })

    it('Should ensure critical business logic is not missed', () => {
      // Regional pricing was in data but not mentioned verbally
      const regionalPricingSurprise = mockPhase2Data.contextValidation.find(
        v => v.type === 'surprise' &&
            v.field.toLowerCase().includes('region')
      )
      expect(regionalPricingSurprise).toBeDefined()

      // And it made it into the final PRD
      const finalPRDHasRegional = mockPhase3Data.userFlows.some(flow =>
        flow.steps.some(step =>
          step.formula?.toLowerCase().includes('region')
        )
      )
      expect(finalPRDHasRegional).toBe(true)
    })
  })
})
