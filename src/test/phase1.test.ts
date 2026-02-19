import { describe, it, expect } from 'vitest'
import { mockPhase1Data, SAMPLE_TRANSCRIPT } from '@/data/mockData'
import type { Phase1Data } from '@/types/project'

/**
 * Phase 1: Meeting Context Extraction Tests
 *
 * According to PRD Section 4.1:
 * - Input: Text transcript (tagged with Speaker IDs)
 * - Processing: LLM analysis to identify actors, workflows, and references to external data
 * - Output: Structured "Preliminary Requirements Definition" (JSON/Markdown)
 */

describe('Phase 1: Meeting Context Extraction', () => {

  describe('Executive Summary & Problem Statement', () => {
    it('should extract high-level business objective', () => {
      expect(mockPhase1Data.executiveSummary.goal).toBeDefined()
      expect(mockPhase1Data.executiveSummary.goal).toContain('ERP')
      expect(mockPhase1Data.executiveSummary.goal.length).toBeGreaterThan(50)
    })

    it('should identify current pain points from the conversation', () => {
      expect(mockPhase1Data.executiveSummary.painPoints).toBeDefined()
      expect(Array.isArray(mockPhase1Data.executiveSummary.painPoints)).toBe(true)
      expect(mockPhase1Data.executiveSummary.painPoints.length).toBeGreaterThan(0)

      // Verify specific pain points mentioned in transcript
      const painPointsText = mockPhase1Data.executiveSummary.painPoints.join(' ')
      expect(painPointsText).toMatch(/inventory|lag|oversell/i)
      expect(painPointsText).toMatch(/pricing|formula|complex/i)
    })
  })

  describe('User Roles & Permissions (Actors)', () => {
    it('should identify all user roles mentioned in the transcript', () => {
      expect(mockPhase1Data.userRoles).toBeDefined()
      expect(Array.isArray(mockPhase1Data.userRoles)).toBe(true)
      expect(mockPhase1Data.userRoles.length).toBeGreaterThan(0)
    })

    it('should extract Sales Rep role with description', () => {
      const salesRep = mockPhase1Data.userRoles.find(r => r.name === 'Sales Rep')
      expect(salesRep).toBeDefined()
      expect(salesRep?.description).toBeDefined()
      expect(salesRep?.description.length).toBeGreaterThan(20)
    })

    it('should extract Sales Manager role with approval authority', () => {
      const salesManager = mockPhase1Data.userRoles.find(r => r.name === 'Sales Manager')
      expect(salesManager).toBeDefined()
      expect(salesManager?.description).toMatch(/approv/i)
      expect(salesManager?.description).toMatch(/\$10,?000/i)
    })

    it('should extract Warehouse Manager role', () => {
      const warehouseManager = mockPhase1Data.userRoles.find(r => r.name === 'Warehouse Manager')
      expect(warehouseManager).toBeDefined()
      expect(warehouseManager?.description).toMatch(/inventory|warehouse|stock/i)
    })

    it('should extract Procurement Officer role', () => {
      const procurementOfficer = mockPhase1Data.userRoles.find(r => r.name === 'Procurement Officer')
      expect(procurementOfficer).toBeDefined()
      expect(procurementOfficer?.description).toMatch(/vendor|purchase|procurement/i)
    })
  })

  describe('Business Logic & Workflow Extraction', () => {
    it('should extract current state workflow steps', () => {
      expect(mockPhase1Data.businessLogic.currentState).toBeDefined()
      expect(Array.isArray(mockPhase1Data.businessLogic.currentState)).toBe(true)
      expect(mockPhase1Data.businessLogic.currentState.length).toBeGreaterThan(5)
    })

    it('should extract future state workflow steps', () => {
      expect(mockPhase1Data.businessLogic.futureState).toBeDefined()
      expect(Array.isArray(mockPhase1Data.businessLogic.futureState)).toBe(true)
      expect(mockPhase1Data.businessLogic.futureState.length).toBeGreaterThan(3)
    })

    it('should identify conditional logic in workflows', () => {
      const stepsWithConditionals = mockPhase1Data.businessLogic.currentState.filter(
        step => step.conditional
      )
      expect(stepsWithConditionals.length).toBeGreaterThan(0)

      // Verify $10,000 approval threshold conditional
      const approvalStep = stepsWithConditionals.find(
        step => step.conditional?.includes('10,000') || step.conditional?.includes('10000')
      )
      expect(approvalStep).toBeDefined()
    })

    it('should show workflow progression from current to future state', () => {
      // Future state should have automation improvements
      const futureStateText = mockPhase1Data.businessLogic.futureState
        .map(s => s.description)
        .join(' ')
      expect(futureStateText).toMatch(/system|automat|real-time/i)
    })
  })

  describe('Functional Requirements (Categorized)', () => {
    it('should categorize requirements into logical ERP modules', () => {
      expect(mockPhase1Data.requirements).toBeDefined()
      expect(Array.isArray(mockPhase1Data.requirements)).toBe(true)
      expect(mockPhase1Data.requirements.length).toBeGreaterThan(3)
    })

    it('should include Inventory Management module', () => {
      const inventoryModule = mockPhase1Data.requirements.find(
        m => m.moduleName.toLowerCase().includes('inventory')
      )
      expect(inventoryModule).toBeDefined()
      expect(inventoryModule?.requirements.length).toBeGreaterThan(0)
    })

    it('should include Pricing & Quoting module', () => {
      const pricingModule = mockPhase1Data.requirements.find(
        m => m.moduleName.toLowerCase().includes('pricing') ||
            m.moduleName.toLowerCase().includes('quoting')
      )
      expect(pricingModule).toBeDefined()
      expect(pricingModule?.requirements.length).toBeGreaterThan(0)
    })

    it('should include Order Management module', () => {
      const orderModule = mockPhase1Data.requirements.find(
        m => m.moduleName.toLowerCase().includes('order')
      )
      expect(orderModule).toBeDefined()
      expect(orderModule?.requirements.length).toBeGreaterThan(0)
    })

    it('should prioritize requirements (High/Medium/Low)', () => {
      const allRequirements = mockPhase1Data.requirements.flatMap(m => m.requirements)
      const withPriority = allRequirements.filter(r =>
        ['High', 'Medium', 'Low'].includes(r.priority)
      )
      expect(withPriority.length).toBe(allRequirements.length)
    })

    it('should provide context/references for each requirement', () => {
      const allRequirements = mockPhase1Data.requirements.flatMap(m => m.requirements)
      const withContext = allRequirements.filter(r => r.context && r.context.length > 0)
      expect(withContext.length).toBe(allRequirements.length)
    })
  })

  describe('External Artifact & Data Mapping (Critical)', () => {
    it('should identify mentioned spreadsheets and external files', () => {
      expect(mockPhase1Data.artifactMapping).toBeDefined()
      expect(Array.isArray(mockPhase1Data.artifactMapping)).toBe(true)
      expect(mockPhase1Data.artifactMapping.length).toBeGreaterThan(0)
    })

    it('should identify Pricing Matrix spreadsheet', () => {
      const pricingMatrix = mockPhase1Data.artifactMapping.find(
        a => a.name.toLowerCase().includes('pricing')
      )
      expect(pricingMatrix).toBeDefined()
      expect(pricingMatrix?.context).toBeDefined()
      expect(pricingMatrix?.expectedFields).toBeDefined()
      expect(pricingMatrix?.expectedFields.length).toBeGreaterThan(0)
    })

    it('should identify Master Inventory Sheet', () => {
      const inventorySheet = mockPhase1Data.artifactMapping.find(
        a => a.name.toLowerCase().includes('inventory')
      )
      expect(inventorySheet).toBeDefined()
      expect(inventorySheet?.context).toBeDefined()
      expect(inventorySheet?.expectedFields).toBeDefined()
      expect(inventorySheet?.expectedFields.length).toBeGreaterThan(0)
    })

    it('should track artifact status (pending/uploaded/analyzed)', () => {
      mockPhase1Data.artifactMapping.forEach(artifact => {
        expect(['pending', 'uploaded', 'analyzed']).toContain(artifact.status)
      })
    })

    it('should list expected data fields for each artifact', () => {
      mockPhase1Data.artifactMapping.forEach(artifact => {
        expect(artifact.expectedFields).toBeDefined()
        expect(Array.isArray(artifact.expectedFields)).toBe(true)
        // Key fields like SKU should be expected
        if (artifact.name.toLowerCase().includes('pricing') ||
            artifact.name.toLowerCase().includes('inventory')) {
          expect(artifact.expectedFields.some(f =>
            f.toLowerCase().includes('sku')
          )).toBe(true)
        }
      })
    })
  })

  describe('Implicit Data Entities', () => {
    it('should infer database entities from conversation', () => {
      expect(mockPhase1Data.dataEntities).toBeDefined()
      expect(Array.isArray(mockPhase1Data.dataEntities)).toBe(true)
      expect(mockPhase1Data.dataEntities.length).toBeGreaterThan(5)
    })

    it('should identify core entities: Customer, Order, Product', () => {
      const entities = mockPhase1Data.dataEntities.map(e => e.toLowerCase())
      expect(entities.some(e => e.includes('customer'))).toBe(true)
      expect(entities.some(e => e.includes('order'))).toBe(true)
      expect(entities.some(e => e.includes('product'))).toBe(true)
    })

    it('should identify inventory-related entities', () => {
      const entities = mockPhase1Data.dataEntities.map(e => e.toLowerCase())
      expect(
        entities.some(e => e.includes('inventory') || e.includes('warehouse'))
      ).toBe(true)
    })

    it('should identify pricing-related entities', () => {
      const entities = mockPhase1Data.dataEntities.map(e => e.toLowerCase())
      expect(
        entities.some(e => e.includes('price') || e.includes('pricing'))
      ).toBe(true)
    })

    it('should identify audit and compliance entities', () => {
      const entities = mockPhase1Data.dataEntities.map(e => e.toLowerCase())
      expect(
        entities.some(e => e.includes('audit') || e.includes('log'))
      ).toBe(true)
    })
  })

  describe('Open Questions & Ambiguities', () => {
    it('should list questions that need clarification', () => {
      expect(mockPhase1Data.openQuestions).toBeDefined()
      expect(Array.isArray(mockPhase1Data.openQuestions)).toBe(true)
      expect(mockPhase1Data.openQuestions.length).toBeGreaterThan(0)
    })

    it('should flag vague or contradictory requirements', () => {
      const questionsText = mockPhase1Data.openQuestions.join(' ')
      // Should ask about specifics not covered in the meeting
      expect(questionsText.length).toBeGreaterThan(50)
    })
  })

  describe('Processing Rules Compliance', () => {
    it('should focus on business logic, not small talk', () => {
      // Verify that extracted data is substantive
      const allRequirements = mockPhase1Data.requirements.flatMap(m => m.requirements)
      expect(allRequirements.length).toBeGreaterThan(10)
    })

    it('should prioritize if/then statements and calculation rules', () => {
      // Check workflow steps have conditional logic
      const hasConditionals = mockPhase1Data.businessLogic.currentState.some(
        step => step.conditional
      )
      expect(hasConditionals).toBe(true)
    })

    it('should flag when client mentions external files', () => {
      // Verify artifact mapping captures file references
      expect(mockPhase1Data.artifactMapping.length).toBeGreaterThan(0)
      expect(mockPhase1Data.artifactMapping.every(a => a.context.length > 0)).toBe(true)
    })

    it('should use standard ERP terminology where applicable', () => {
      const allModuleNames = mockPhase1Data.requirements.map(m => m.moduleName).join(' ')
      // Should see standard terms like O2C, P2P, or standard module names
      expect(allModuleNames).toMatch(/inventory|order|pricing|procurement|reporting/i)
    })
  })

  describe('Input Transcript Integration', () => {
    it('should accept and store the transcript', () => {
      expect(mockPhase1Data.transcript).toBeDefined()
      expect(mockPhase1Data.transcript.length).toBeGreaterThan(100)
    })

    it('should handle speaker-tagged transcript format', () => {
      const transcript = SAMPLE_TRANSCRIPT
      expect(transcript).toMatch(/\[Flow_Engineer\]/)
      expect(transcript).toMatch(/\[Client\]/)
    })
  })
})
