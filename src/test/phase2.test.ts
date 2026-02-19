import { describe, it, expect } from 'vitest'
import { mockPhase2Data, mockPhase1Data } from '@/data/mockData'
import type { Phase2Data } from '@/types/project'

/**
 * Phase 2: Artifact Analysis (Spreadsheet Parsing) Tests
 *
 * According to PRD Section 4.2:
 * - Input: Spreadsheets (.xlsx, .csv) and the "Artifact Mapping" context from Phase 1
 * - Processing: Analyze file structure, identifying key entities (headers) and logic (formulas)
 * - Output: A "Data Logic Map" describing how the client's data currently behaves
 */

describe('Phase 2: Artifact Analysis & Logic Extraction', () => {

  describe('Schema & Data Dictionary', () => {
    it('should generate schema definitions for uploaded artifacts', () => {
      expect(mockPhase2Data.schemas).toBeDefined()
      expect(Array.isArray(mockPhase2Data.schemas)).toBe(true)
      expect(mockPhase2Data.schemas.length).toBeGreaterThan(0)
    })

    it('should propose appropriate table names from artifact names', () => {
      mockPhase2Data.schemas.forEach(schema => {
        expect(schema.proposedTableName).toBeDefined()
        expect(schema.proposedTableName.length).toBeGreaterThan(0)
        // Should be valid table names (lowercase, underscores)
        expect(schema.proposedTableName).toMatch(/^[a-z_]+$/)
      })
    })

    it('should map columns to technical field types', () => {
      mockPhase2Data.schemas.forEach(schema => {
        expect(schema.columns.length).toBeGreaterThan(0)
        schema.columns.forEach(col => {
          expect(col.columnName).toBeDefined()
          expect(col.targetType).toBeDefined()
          expect(col.description).toBeDefined()
          expect(typeof col.nullable).toBe('boolean')
          expect(typeof col.isPrimaryKey).toBe('boolean')
          expect(typeof col.isForeignKey).toBe('boolean')
        })
      })
    })

    it('should identify primary keys correctly', () => {
      const pricingSchema = mockPhase2Data.schemas.find(
        s => s.artifactName.toLowerCase().includes('pricing')
      )
      expect(pricingSchema).toBeDefined()

      const primaryKeys = pricingSchema?.columns.filter(c => c.isPrimaryKey)
      expect(primaryKeys?.length).toBeGreaterThan(0)
      expect(primaryKeys?.some(pk => pk.columnName.toLowerCase().includes('sku'))).toBe(true)
    })

    it('should identify foreign keys correctly', () => {
      const inventorySchema = mockPhase2Data.schemas.find(
        s => s.artifactName.toLowerCase().includes('inventory')
      )
      expect(inventorySchema).toBeDefined()

      const foreignKeys = inventorySchema?.columns.filter(c => c.isForeignKey)
      expect(foreignKeys?.length).toBeGreaterThan(0)
    })

    it('should infer nullable fields from sample data', () => {
      mockPhase2Data.schemas.forEach(schema => {
        const nullableFields = schema.columns.filter(c => c.nullable)
        const requiredFields = schema.columns.filter(c => !c.nullable)
        // Should have a mix of nullable and required fields
        expect(requiredFields.length).toBeGreaterThan(0)
      })
    })

    it('should correctly type currency fields', () => {
      const pricingSchema = mockPhase2Data.schemas.find(
        s => s.artifactName.toLowerCase().includes('pricing')
      )
      const priceField = pricingSchema?.columns.find(
        c => c.columnName.toLowerCase().includes('price')
      )
      expect(priceField).toBeDefined()
      expect(priceField?.targetType).toMatch(/decimal/i)
    })

    it('should correctly identify Enum types', () => {
      const schemas = mockPhase2Data.schemas
      const enumFields = schemas.flatMap(s => s.columns).filter(
        c => c.targetType.toLowerCase().includes('enum')
      )
      expect(enumFields.length).toBeGreaterThan(0)
    })
  })

  describe('Logic Reverse-Engineering', () => {
    it('should extract calculated fields from formulas', () => {
      expect(mockPhase2Data.logicAnalysis.calculatedFields).toBeDefined()
      expect(mockPhase2Data.logicAnalysis.calculatedFields.length).toBeGreaterThan(0)
    })

    it('should identify pricing calculation formula', () => {
      const pricingFormula = mockPhase2Data.logicAnalysis.calculatedFields.find(
        f => f.fieldName.toLowerCase().includes('price')
      )
      expect(pricingFormula).toBeDefined()
      expect(pricingFormula?.formula).toBeDefined()
      expect(pricingFormula?.formula.length).toBeGreaterThan(10)
    })

    it('should identify tiered discount logic', () => {
      const discountLogic = mockPhase2Data.logicAnalysis.calculatedFields.find(
        f => f.formula.toLowerCase().includes('tier') || f.formula.toLowerCase().includes('discount')
      )
      expect(discountLogic).toBeDefined()
      expect(discountLogic?.confidence).toBeDefined()
      expect(['Certain', 'Likely', 'Inferred']).toContain(discountLogic?.confidence)
    })

    it('should identify inventory availability calculation', () => {
      const availabilityCalc = mockPhase2Data.logicAnalysis.calculatedFields.find(
        f => f.fieldName.toLowerCase().includes('available')
      )
      expect(availabilityCalc).toBeDefined()
      expect(availabilityCalc?.formula).toMatch(/qty|reserved/i)
    })

    it('should extract categorical rules with distinct values', () => {
      expect(mockPhase2Data.logicAnalysis.categoricalRules).toBeDefined()
      expect(mockPhase2Data.logicAnalysis.categoricalRules.length).toBeGreaterThan(0)

      mockPhase2Data.logicAnalysis.categoricalRules.forEach(rule => {
        expect(rule.columnName).toBeDefined()
        expect(rule.distinctValues).toBeDefined()
        expect(Array.isArray(rule.distinctValues)).toBe(true)
        expect(rule.distinctValues.length).toBeGreaterThan(0)
        expect(rule.recommendedType).toBeDefined()
      })
    })

    it('should identify warehouse enum values', () => {
      const warehouseRule = mockPhase2Data.logicAnalysis.categoricalRules.find(
        r => r.columnName.toLowerCase().includes('warehouse')
      )
      expect(warehouseRule).toBeDefined()
      expect(warehouseRule?.distinctValues.length).toBe(3) // Three warehouses mentioned
    })

    it('should identify implicit keys with evidence', () => {
      expect(mockPhase2Data.logicAnalysis.implicitKeys).toBeDefined()
      expect(mockPhase2Data.logicAnalysis.implicitKeys.length).toBeGreaterThan(0)

      mockPhase2Data.logicAnalysis.implicitKeys.forEach(key => {
        expect(key.columnName).toBeDefined()
        expect(key.keyType).toBeDefined()
        expect(['Primary', 'Foreign', 'Composite']).toContain(key.keyType)
        expect(key.evidence).toBeDefined()
        expect(key.evidence.length).toBeGreaterThan(20)
      })
    })

    it('should identify composite keys for multi-warehouse inventory', () => {
      const compositeKey = mockPhase2Data.logicAnalysis.implicitKeys.find(
        k => k.keyType === 'Composite'
      )
      expect(compositeKey).toBeDefined()
      expect(compositeKey?.columnName).toMatch(/\+|warehouse/i)
    })
  })

  describe('Context Validation (Reality Check)', () => {
    it('should compare meeting claims against spreadsheet data', () => {
      expect(mockPhase2Data.contextValidation).toBeDefined()
      expect(Array.isArray(mockPhase2Data.contextValidation)).toBe(true)
      expect(mockPhase2Data.contextValidation.length).toBeGreaterThan(0)
    })

    it('should categorize validations by type (confirmed/discrepancy/surprise)', () => {
      mockPhase2Data.contextValidation.forEach(validation => {
        expect(['confirmed', 'discrepancy', 'surprise']).toContain(validation.type)
        expect(['critical', 'warning', 'info']).toContain(validation.severity)
      })
    })

    it('should confirm claims that match the data', () => {
      const confirmedItems = mockPhase2Data.contextValidation.filter(
        v => v.type === 'confirmed'
      )
      expect(confirmedItems.length).toBeGreaterThan(0)

      confirmedItems.forEach(item => {
        expect(item.dataEvidence).toBeDefined()
        expect(item.dataEvidence.length).toBeGreaterThan(10)
      })
    })

    it('should flag critical discrepancies', () => {
      const discrepancies = mockPhase2Data.contextValidation.filter(
        v => v.type === 'discrepancy'
      )
      expect(discrepancies.length).toBeGreaterThan(0)

      discrepancies.forEach(item => {
        expect(item.meetingClaim).toBeDefined()
        expect(item.dataEvidence).toBeDefined()
        expect(item.recommendation).toBeDefined()
      })
    })

    it('should identify missing approval workflow data (critical discrepancy)', () => {
      const approvalDiscrepancy = mockPhase2Data.contextValidation.find(
        v => v.field.toLowerCase().includes('approval') && v.type === 'discrepancy'
      )
      expect(approvalDiscrepancy).toBeDefined()
      expect(approvalDiscrepancy?.severity).toBe('critical')
      expect(approvalDiscrepancy?.recommendation).toBeDefined()
    })

    it('should identify unexpected data (surprises)', () => {
      const surprises = mockPhase2Data.contextValidation.filter(
        v => v.type === 'surprise'
      )
      expect(surprises.length).toBeGreaterThan(0)

      surprises.forEach(item => {
        expect(item.dataEvidence).toBeDefined()
        expect(item.recommendation).toBeDefined()
      })
    })

    it('should discover regional pricing (never mentioned in meeting)', () => {
      const regionalPricing = mockPhase2Data.contextValidation.find(
        v => v.field.toLowerCase().includes('region') &&
            v.type === 'surprise'
      )
      expect(regionalPricing).toBeDefined()
      expect(regionalPricing?.severity).toBe('critical')
    })

    it('should provide actionable recommendations for discrepancies', () => {
      const itemsWithRecommendations = mockPhase2Data.contextValidation.filter(
        v => v.recommendation && v.recommendation.length > 0
      )
      expect(itemsWithRecommendations.length).toBeGreaterThan(0)
    })
  })

  describe('Entity Relationship Inference (Normalization)', () => {
    it('should propose database normalization recommendations', () => {
      expect(mockPhase2Data.normalization).toBeDefined()
      expect(Array.isArray(mockPhase2Data.normalization)).toBe(true)
      expect(mockPhase2Data.normalization.length).toBeGreaterThan(0)
    })

    it('should identify flat structures that need normalization', () => {
      mockPhase2Data.normalization.forEach(norm => {
        expect(norm.sourceDescription).toBeDefined()
        expect(norm.sourceArtifact).toBeDefined()
        expect(norm.proposedEntities).toBeDefined()
        expect(Array.isArray(norm.proposedEntities)).toBe(true)
        expect(norm.proposedEntities.length).toBeGreaterThan(1) // Should split into multiple entities
        expect(norm.rationale).toBeDefined()
      })
    })

    it('should propose splitting Pricing Matrix into normalized tables', () => {
      const pricingNorm = mockPhase2Data.normalization.find(
        n => n.sourceArtifact.toLowerCase().includes('pricing')
      )
      expect(pricingNorm).toBeDefined()
      expect(pricingNorm?.proposedEntities.length).toBeGreaterThan(1)

      const entityNames = pricingNorm?.proposedEntities.map(e => e.name.toLowerCase())
      expect(entityNames?.some(n => n.includes('product'))).toBe(true)
      expect(entityNames?.some(n => n.includes('price') || n.includes('discount'))).toBe(true)
    })

    it('should propose splitting Inventory into normalized tables', () => {
      const inventoryNorm = mockPhase2Data.normalization.find(
        n => n.sourceArtifact.toLowerCase().includes('inventory')
      )
      expect(inventoryNorm).toBeDefined()
      expect(inventoryNorm?.proposedEntities.length).toBeGreaterThan(1)
    })

    it('should define relationships between normalized entities', () => {
      mockPhase2Data.normalization.forEach(norm => {
        norm.proposedEntities.forEach(entity => {
          expect(entity.name).toBeDefined()
          expect(entity.linkedBy).toBeDefined()
          expect(entity.linkedBy.length).toBeGreaterThan(0)
        })
      })
    })

    it('should provide rationale for normalization decisions', () => {
      mockPhase2Data.normalization.forEach(norm => {
        expect(norm.rationale).toBeDefined()
        expect(norm.rationale.length).toBeGreaterThan(50)
      })
    })
  })

  describe('Artifact Processing', () => {
    it('should process uploaded artifacts and extract metadata', () => {
      expect(mockPhase2Data.artifacts).toBeDefined()
      expect(Array.isArray(mockPhase2Data.artifacts)).toBe(true)
      expect(mockPhase2Data.artifacts.length).toBeGreaterThan(0)
    })

    it('should extract column headers from spreadsheets', () => {
      mockPhase2Data.artifacts.forEach(artifact => {
        expect(artifact.headers).toBeDefined()
        expect(Array.isArray(artifact.headers)).toBe(true)
        expect(artifact.headers.length).toBeGreaterThan(0)
      })
    })

    it('should capture sample rows for analysis', () => {
      mockPhase2Data.artifacts.forEach(artifact => {
        expect(artifact.sampleRows).toBeDefined()
        expect(Array.isArray(artifact.sampleRows)).toBe(true)
        expect(artifact.sampleRows.length).toBeGreaterThan(0)
      })
    })

    it('should extract formulas from cells', () => {
      mockPhase2Data.artifacts.forEach(artifact => {
        expect(artifact.formulasFound).toBeDefined()
        expect(Array.isArray(artifact.formulasFound)).toBe(true)
      })

      // At least one artifact should have formulas
      const artifactsWithFormulas = mockPhase2Data.artifacts.filter(
        a => a.formulasFound.length > 0
      )
      expect(artifactsWithFormulas.length).toBeGreaterThan(0)
    })

    it('should infer data types for each column', () => {
      mockPhase2Data.artifacts.forEach(artifact => {
        expect(artifact.dataTypes).toBeDefined()
        expect(Object.keys(artifact.dataTypes).length).toBeGreaterThan(0)
      })
    })

    it('should identify entity relationships within artifacts', () => {
      mockPhase2Data.artifacts.forEach(artifact => {
        expect(artifact.entityRelationships).toBeDefined()
        expect(Array.isArray(artifact.entityRelationships)).toBe(true)
      })
    })
  })

  describe('Validation Against Phase 1 Expectations', () => {
    it('should validate expected fields from Phase 1 artifact mapping', () => {
      expect(mockPhase2Data.validationResults).toBeDefined()
      expect(Array.isArray(mockPhase2Data.validationResults)).toBe(true)
      expect(mockPhase2Data.validationResults.length).toBeGreaterThan(0)
    })

    it('should mark expected fields as "match" when found', () => {
      const matches = mockPhase2Data.validationResults.filter(
        v => v.status === 'match'
      )
      expect(matches.length).toBeGreaterThan(0)
    })

    it('should mark expected fields as "mismatch" when not found', () => {
      const mismatches = mockPhase2Data.validationResults.filter(
        v => v.status === 'mismatch'
      )
      // Should have some mismatches (e.g., vendor data not in spreadsheets)
      expect(mismatches.length).toBeGreaterThan(0)
    })

    it('should mark unexpected fields as "extra"', () => {
      const extras = mockPhase2Data.validationResults.filter(
        v => v.status === 'extra'
      )
      // Should identify cross-sheet VLOOKUP or other unexpected logic
      expect(extras.length).toBeGreaterThan(0)
    })

    it('should validate SKU field (mentioned in Phase 1)', () => {
      const skuValidation = mockPhase2Data.validationResults.find(
        v => v.field.toLowerCase().includes('sku')
      )
      expect(skuValidation).toBeDefined()
      expect(skuValidation?.status).toBe('match')
    })
  })

  describe('Data Quality Assessment', () => {
    it('should identify "dirty" data patterns', () => {
      // Check if context validation flags data quality issues
      const dataQualityIssues = mockPhase2Data.contextValidation.filter(
        v => v.dataEvidence.toLowerCase().includes('lag') ||
            v.dataEvidence.toLowerCase().includes('update') ||
            v.dataEvidence.toLowerCase().includes('stale')
      )
      // Should detect the 1-2 day lag in inventory updates
      expect(dataQualityIssues.length).toBeGreaterThan(0)
    })
  })

  describe('Integration with Phase 1', () => {
    it('should reference Phase 1 artifact mapping', () => {
      // Each schema should map to an artifact from Phase 1
      mockPhase2Data.schemas.forEach(schema => {
        expect(schema.artifactId).toBeDefined()
        expect(schema.artifactName).toBeDefined()

        // Verify artifact was mentioned in Phase 1
        const phase1Artifact = mockPhase1Data.artifactMapping.find(
          a => a.id === schema.artifactId
        )
        expect(phase1Artifact).toBeDefined()
      })
    })

    it('should validate Phase 1 expected fields against actual data', () => {
      // Phase 1 expected fields should be validated in Phase 2
      mockPhase1Data.artifactMapping.forEach(phase1Artifact => {
        const validations = mockPhase2Data.validationResults.filter(
          v => phase1Artifact.expectedFields.some(
            expectedField => v.field.toLowerCase().includes(expectedField.toLowerCase())
          )
        )
        expect(validations.length).toBeGreaterThan(0)
      })
    })
  })
})
