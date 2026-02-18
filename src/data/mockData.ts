import type {
  Project, Phase1Data, Phase2Data, Phase3Data,
  SchemaDefinition, LogicAnalysis, ContextValidation,
  NormalizationRecommendation, ProjectOverview, ArchitectureSpec,
  UserFlow, MigrationPlan, ConflictResolution,
} from "@/types/project";

export const SAMPLE_TRANSCRIPT = `[Flow_Engineer]: Thanks for joining today. Let's walk through your current inventory and order management process.

[Client]: Sure. Right now, we manage everything through a combination of spreadsheets and manual processes. Our warehouse team uses an Excel file — we call it the "Master Inventory Sheet" — to track stock levels across three warehouses.

[Flow_Engineer]: Got it. Who maintains that spreadsheet?

[Client]: Mostly our Warehouse Managers. They update it daily, but sometimes there's a lag. The Sales team also has their own "Pricing Matrix" spreadsheet that they use for quoting.

[Flow_Engineer]: How does the quoting process work currently?

[Client]: A Sales Rep gets a request from a customer. They look up the product in the Pricing Matrix, which has base prices, volume discounts, and margin multipliers. If the order is over $10,000, the Sales Manager has to approve it before we can confirm.

[Flow_Engineer]: What happens after approval?

[Client]: The Sales Rep creates a manual order form — it's a Word doc template — and emails it to the Warehouse Manager. The Warehouse Manager checks stock in the Master Inventory Sheet, and if we have enough, they mark it as "Reserved." If not, they flag it for procurement.

[Flow_Engineer]: And procurement?

[Client]: Our Procurement Officer handles that. They have a list of approved vendors. When stock is low, they create a Purchase Order. The PO goes to the vendor, and when goods arrive, the Warehouse Manager updates the inventory sheet.

[Flow_Engineer]: What are the biggest pain points?

[Client]: Honestly, the lag in inventory updates is killing us. We've oversold products three times this quarter because the spreadsheet wasn't updated. Also, the pricing logic in the Pricing Matrix is getting really complex — there are nested IF formulas that nobody fully understands anymore. And we have no visibility into order status. Customers call asking "where's my order?" and we have to manually check with the warehouse.

[Flow_Engineer]: That's really helpful. Are there any compliance or reporting requirements?

[Client]: Yes, we need monthly sales reports broken down by region and product category. And for auditing, we need to track every price override — when a Sales Manager approves a discount beyond the standard matrix.

[Flow_Engineer]: Perfect. Let me summarize what I'm hearing — you need a unified system that handles inventory across warehouses in real-time, automates the quoting and approval workflow, manages procurement, and gives you visibility into order status with proper audit trails.

[Client]: Exactly. And it needs to import our existing data from those spreadsheets. The Pricing Matrix especially — that's years of pricing logic we can't lose.`;

export const mockPhase1Data: Phase1Data = {
  transcript: SAMPLE_TRANSCRIPT,
  executiveSummary: {
    goal: "Replace fragmented Excel-based inventory, pricing, and order management with a unified ERP system providing real-time visibility, automated workflows, and audit compliance.",
    painPoints: [
      "Inventory data lag causing overselling (3 incidents this quarter)",
      "Complex, unmaintainable pricing formulas in Excel (nested IF statements)",
      "No real-time order status visibility for customers or internal teams",
      "Manual order processing via Word docs and email",
      "No audit trail for price overrides and discount approvals",
    ],
  },
  userRoles: [
    { name: "Sales Rep", description: "Creates quotes using the Pricing Matrix, submits orders for customer requests. Primary system user for the Order-to-Cash flow." },
    { name: "Sales Manager", description: "Approves orders exceeding $10,000 threshold. Authorizes price overrides and non-standard discounts. Needs reporting dashboards." },
    { name: "Warehouse Manager", description: "Maintains inventory levels across 3 warehouses. Reserves stock for confirmed orders. Flags low-stock items for procurement." },
    { name: "Procurement Officer", description: "Manages vendor relationships and approved vendor list. Creates Purchase Orders when stock is low. Tracks inbound shipments." },
    { name: "Customer", description: "External actor. Requests quotes, places orders, and inquires about order status. Needs self-service visibility." },
  ],
  businessLogic: {
    currentState: [
      { step: 1, description: "Customer contacts Sales Rep with a product request" },
      { step: 2, description: "Sales Rep looks up pricing in the 'Pricing Matrix' spreadsheet" },
      { step: 3, description: "Sales Rep calculates quote using base price, volume discounts, and margin multipliers" },
      { step: 4, description: "If order > $10,000, Sales Manager must manually approve", conditional: "Order value exceeds $10,000" },
      { step: 5, description: "Sales Rep creates Word doc order form and emails to Warehouse Manager" },
      { step: 6, description: "Warehouse Manager checks 'Master Inventory Sheet' for stock availability" },
      { step: 7, description: "If stock available, Warehouse Manager marks as 'Reserved' in spreadsheet", conditional: "Sufficient stock available" },
      { step: 8, description: "If stock insufficient, Warehouse Manager flags for procurement", conditional: "Insufficient stock" },
      { step: 9, description: "Procurement Officer creates Purchase Order to approved vendor" },
      { step: 10, description: "Upon goods receipt, Warehouse Manager manually updates inventory spreadsheet" },
    ],
    futureState: [
      { step: 1, description: "Customer submits request via portal or Sales Rep enters into ERP" },
      { step: 2, description: "System auto-calculates pricing using imported Pricing Matrix logic" },
      { step: 3, description: "System checks real-time inventory across all 3 warehouses" },
      { step: 4, description: "Automated approval workflow triggers for orders > $10,000", conditional: "Order value exceeds $10,000" },
      { step: 5, description: "Order confirmed and stock automatically reserved in real-time" },
      { step: 6, description: "System auto-generates Purchase Order when stock falls below threshold", conditional: "Stock below reorder point" },
      { step: 7, description: "Customer receives real-time order status updates" },
      { step: 8, description: "All price overrides logged with full audit trail" },
    ],
  },
  requirements: [
    {
      moduleName: "Inventory Management",
      requirements: [
        { id: "inv-1", description: "Real-time inventory tracking across 3 warehouse locations", priority: "High", context: "Client mentioned overselling 3 times this quarter due to lag", checked: false },
        { id: "inv-2", description: "Automatic stock reservation upon order confirmation", priority: "High", context: "Currently manual process via spreadsheet marking", checked: false },
        { id: "inv-3", description: "Low-stock alerts and automatic reorder point triggers", priority: "Medium", context: "Procurement is currently reactive, not proactive", checked: false },
        { id: "inv-4", description: "Multi-warehouse transfer and allocation management", priority: "Medium", context: "Three warehouses mentioned, need cross-warehouse visibility", checked: false },
      ],
    },
    {
      moduleName: "Pricing & Quoting",
      requirements: [
        { id: "prc-1", description: "Import and replicate Pricing Matrix logic (base price, volume discounts, margin multipliers)", priority: "High", context: "Client: 'years of pricing logic we can't lose'", checked: false },
        { id: "prc-2", description: "Automated quote generation based on product and quantity", priority: "High", context: "Currently manual lookup in spreadsheet", checked: false },
        { id: "prc-3", description: "Price override capability with mandatory audit logging", priority: "High", context: "Compliance requirement for auditing discount approvals", checked: false },
        { id: "prc-4", description: "Volume discount tiers with configurable thresholds", priority: "Medium", context: "Pricing Matrix contains volume discount logic", checked: false },
      ],
    },
    {
      moduleName: "Order Management (O2C)",
      requirements: [
        { id: "ord-1", description: "Digital order creation replacing Word doc templates", priority: "High", context: "Currently using Word doc templates emailed manually", checked: false },
        { id: "ord-2", description: "Approval workflow for orders exceeding $10,000", priority: "High", context: "Client: 'If the order is over $10,000, the Sales Manager must approve'", checked: false },
        { id: "ord-3", description: "Real-time order status tracking visible to all stakeholders", priority: "High", context: "Client: 'Customers call asking where's my order'", checked: false },
        { id: "ord-4", description: "Order history and customer order portal", priority: "Medium", context: "Implied need for customer self-service", checked: false },
      ],
    },
    {
      moduleName: "Procurement (P2P)",
      requirements: [
        { id: "pro-1", description: "Approved vendor management and vendor catalog", priority: "Medium", context: "Procurement Officer manages approved vendor list", checked: false },
        { id: "pro-2", description: "Purchase Order generation and tracking", priority: "High", context: "PO creation is part of current procurement workflow", checked: false },
        { id: "pro-3", description: "Goods receipt processing with automatic inventory update", priority: "High", context: "Currently manual update upon goods arrival", checked: false },
      ],
    },
    {
      moduleName: "Reporting & Compliance",
      requirements: [
        { id: "rep-1", description: "Monthly sales reports by region and product category", priority: "Medium", context: "Client explicitly mentioned this reporting requirement", checked: false },
        { id: "rep-2", description: "Audit trail for all price overrides and discount approvals", priority: "High", context: "Compliance requirement mentioned for auditing", checked: false },
        { id: "rep-3", description: "Dashboard with KPIs for inventory turnover, order fulfillment rate", priority: "Low", context: "Implied from need for visibility", checked: false },
      ],
    },
  ],
  artifactMapping: [
    {
      id: "art-1",
      name: "Pricing Matrix Spreadsheet",
      context: "Client said this sheet contains the logic for calculating bulk discounts, base prices, and margin multipliers. Contains nested IF formulas that are complex. Described as 'years of pricing logic we can't lose.'",
      expectedFields: ["SKU", "Product Name", "Base Price", "Volume Discount Tiers", "Margin Multiplier", "Region Pricing"],
      status: "pending",
    },
    {
      id: "art-2",
      name: "Master Inventory Sheet",
      context: "Used by Warehouse Managers to track stock levels across three warehouses. Updated daily (with lag). Contains current stock quantities and reservation status.",
      expectedFields: ["SKU", "Product Name", "Warehouse Location", "Quantity On Hand", "Reserved Quantity", "Reorder Point"],
      status: "pending",
    },
  ],
  dataEntities: [
    "Customer", "Order", "Order_Line_Item", "Product", "Price_Rule",
    "Warehouse", "Inventory_Record", "Purchase_Order", "PO_Line_Item",
    "Vendor", "Invoice", "Approval_Request", "Audit_Log", "User",
  ],
  openQuestions: [
    "What are the specific volume discount tiers and breakpoints in the Pricing Matrix?",
    "Are there different pricing rules per region, or is pricing uniform?",
    "What is the current reorder point logic — is it fixed per product or dynamic?",
    "How many SKUs are currently in the system?",
    "Is there an existing customer database, or are customers tracked in the spreadsheets?",
    "What is the desired SLA for order status updates (real-time vs. batch)?",
    "Are there any integrations needed with shipping carriers or accounting software?",
    "What user authentication method is preferred (SSO, email/password, etc.)?",
  ],
};

// ─── Phase 2 Enhanced Mock Data ────────────────────────

const mockSchemas: SchemaDefinition[] = [
  {
    proposedTableName: "product_pricing",
    artifactId: "art-1",
    artifactName: "Pricing Matrix Spreadsheet",
    columns: [
      { columnName: "SKU", targetType: "Varchar(20)", description: "Unique product identifier. Acts as the primary key linking pricing to inventory.", nullable: false, isPrimaryKey: true, isForeignKey: false },
      { columnName: "Product Name", targetType: "Varchar(255)", description: "Human-readable product display name.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Category", targetType: "Enum", description: "Product category grouping. Distinct values: Widgets, Gadgets.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Base Price", targetType: "Decimal(10,2)", description: "Standard unit price before discounts or margin. Stored as currency with '$' prefix in source.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Tier 1 Qty", targetType: "Integer", description: "Minimum quantity threshold for Tier 1 volume discount.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Tier 1 Discount", targetType: "Decimal(5,4)", description: "Percentage discount applied at Tier 1 quantity. Stored as '5%' in source — convert to 0.05.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Tier 2 Qty", targetType: "Integer", description: "Minimum quantity threshold for Tier 2 volume discount.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Tier 2 Discount", targetType: "Decimal(5,4)", description: "Percentage discount applied at Tier 2 quantity. Stored as '12%' in source — convert to 0.12.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Margin Multiplier", targetType: "Decimal(4,2)", description: "Per-product margin multiplier applied after discount calculation.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Region", targetType: "Enum", description: "Geographic region for regional pricing adjustments. Distinct values: Northeast, West, All.", nullable: false, isPrimaryKey: false, isForeignKey: false },
    ],
  },
  {
    proposedTableName: "inventory_records",
    artifactId: "art-2",
    artifactName: "Master Inventory Sheet",
    columns: [
      { columnName: "SKU", targetType: "Varchar(20)", description: "Product identifier. Foreign key to product_pricing table.", nullable: false, isPrimaryKey: false, isForeignKey: true },
      { columnName: "Product Name", targetType: "Varchar(255)", description: "Denormalized product name — should be resolved via FK join in ERP.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Warehouse", targetType: "Enum", description: "Warehouse location code. Distinct values: WH-East, WH-Central, WH-West.", nullable: false, isPrimaryKey: false, isForeignKey: true },
      { columnName: "Qty On Hand", targetType: "Integer", description: "Current physical stock count at this warehouse location.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Reserved", targetType: "Integer", description: "Quantity reserved for confirmed orders, not yet shipped.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Available", targetType: "Integer (Computed)", description: "CALCULATED: Qty On Hand - Reserved. Should be a computed column, not stored.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Reorder Point", targetType: "Integer", description: "Threshold below which a reorder alert should trigger. Fixed per product per warehouse.", nullable: false, isPrimaryKey: false, isForeignKey: false },
      { columnName: "Last Updated", targetType: "Timestamp", description: "Date of last manual update. Shows lag of 1-2 days in sample data.", nullable: true, isPrimaryKey: false, isForeignKey: false },
    ],
  },
];

const mockLogicAnalysis: LogicAnalysis = {
  calculatedFields: [
    {
      fieldName: "Final Price",
      formula: "IF(qty > Tier2_Qty, Base_Price × (1 - Tier2_Discount) × Margin_Multiplier, IF(qty > Tier1_Qty, Base_Price × (1 - Tier1_Discount) × Margin_Multiplier, Base_Price × Margin_Multiplier))",
      sourceArtifact: "Pricing Matrix",
      confidence: "Certain",
    },
    {
      fieldName: "Regional Adjustment",
      formula: "IF(Region = 'Northeast', price × 1.05, IF(Region = 'West', price × 0.98, price))",
      sourceArtifact: "Pricing Matrix",
      confidence: "Certain",
    },
    {
      fieldName: "Available Quantity",
      formula: "Qty_On_Hand - Reserved",
      sourceArtifact: "Master Inventory",
      confidence: "Certain",
    },
    {
      fieldName: "Reorder Trigger",
      formula: "IF(Available < Reorder_Point, 'REORDER', 'OK')",
      sourceArtifact: "Master Inventory",
      confidence: "Certain",
    },
    {
      fieldName: "Cross-Sheet Inventory Lookup",
      formula: "VLOOKUP(SKU, Inventory!A:D, 4, FALSE)",
      sourceArtifact: "Pricing Matrix",
      confidence: "Likely",
    },
    {
      fieldName: "Total Across Warehouses",
      formula: "SUMIF(Warehouse, 'WH-*', Qty_On_Hand)",
      sourceArtifact: "Master Inventory",
      confidence: "Inferred",
    },
  ],
  categoricalRules: [
    { columnName: "Category", sourceArtifact: "Pricing Matrix", distinctValues: ["Widgets", "Gadgets"], recommendedType: "Enum('Widgets', 'Gadgets')" },
    { columnName: "Region", sourceArtifact: "Pricing Matrix", distinctValues: ["Northeast", "West", "All"], recommendedType: "Enum('Northeast', 'West', 'All')" },
    { columnName: "Warehouse", sourceArtifact: "Master Inventory", distinctValues: ["WH-East", "WH-Central", "WH-West"], recommendedType: "Enum('WH-East', 'WH-Central', 'WH-West')" },
  ],
  implicitKeys: [
    { columnName: "SKU", sourceArtifact: "Pricing Matrix", keyType: "Primary", evidence: "Unique across all rows in Pricing Matrix. Used as lookup key in VLOOKUP formulas." },
    { columnName: "SKU + Warehouse", sourceArtifact: "Master Inventory", keyType: "Composite", evidence: "Same SKU appears multiple times (once per warehouse). The combination of SKU + Warehouse is unique." },
    { columnName: "SKU (Inventory)", sourceArtifact: "Master Inventory", keyType: "Foreign", evidence: "References SKU in Pricing Matrix via VLOOKUP cross-reference." },
  ],
};

const mockContextValidation: ContextValidation[] = [
  { type: "confirmed", field: "Volume Discount Tiers", meetingClaim: "Client mentioned volume discounts and margin multipliers in the Pricing Matrix.", dataEvidence: "Two-tier discount structure confirmed: Tier 1 (qty 50-100, 5-8% off) and Tier 2 (qty 200-500, 10-15% off).", severity: "info" },
  { type: "confirmed", field: "Three Warehouses", meetingClaim: "Client said they track stock across three warehouses.", dataEvidence: "Warehouse column contains exactly 3 distinct values: WH-East, WH-Central, WH-West.", severity: "info" },
  { type: "confirmed", field: "Reorder Points", meetingClaim: "Open question: Is reorder logic fixed or dynamic?", dataEvidence: "Data shows fixed reorder points per product per warehouse (e.g., WDG-001: East=500, Central=300, West=200). ANSWERS open question #3.", severity: "info" },
  { type: "confirmed", field: "Pricing Complexity", meetingClaim: "Client said 'nested IF formulas that nobody fully understands.'", dataEvidence: "Confirmed: 3-level nested IF formula for tiered pricing + separate regional adjustment formula. Both have been fully reverse-engineered.", severity: "info" },
  { type: "discrepancy", field: "Manager Approval Column", meetingClaim: "Client stated every order over $10,000 requires Sales Manager approval.", dataEvidence: "Neither spreadsheet contains ANY column for approvals, signatures, or authorization status. The approval workflow exists only verbally — no data trail.", recommendation: "The ERP must CREATE this workflow from scratch. Add an 'approval_status' field to the Order entity and build the routing logic. No legacy data to migrate for approvals.", severity: "critical" },
  { type: "discrepancy", field: "Order Status Tracking", meetingClaim: "Client wants real-time order status visibility.", dataEvidence: "No order data exists in either uploaded file. Orders are currently Word documents sent via email — there is no structured order data to migrate.", recommendation: "Order Management module starts with a clean slate. Focus on defining status enum (Draft → Pending → Confirmed → Fulfilled → Invoiced) and building the workflow engine.", severity: "critical" },
  { type: "discrepancy", field: "Partial Shipments", meetingClaim: "Not explicitly discussed — client implied orders are fulfilled completely.", dataEvidence: "Inventory sheet shows 'Reserved' quantities that don't match typical full-order patterns (e.g., 85 units reserved for Gadget Pro). This suggests partial reservations may already occur.", recommendation: "Clarify with client: Does the ERP need to support partial shipments and split orders? Data suggests this is already happening informally.", severity: "warning" },
  { type: "surprise", field: "Regional Price Adjustments", dataEvidence: "The Pricing Matrix contains a formula that adjusts prices by region: Northeast +5%, West -2%. This was NEVER mentioned in the meeting transcript.", recommendation: "Critical discovery: The pricing engine must support per-region price modifiers. Ask client to confirm all regional rules and whether more regions exist beyond Northeast, West, and 'All'.", severity: "critical" },
  { type: "surprise", field: "Cross-Sheet VLOOKUP Dependency", dataEvidence: "The Pricing Matrix contains a VLOOKUP formula that references the Inventory sheet (=VLOOKUP(SKU, Inventory!A:D, 4, FALSE)). This means pricing decisions currently depend on live inventory data.", recommendation: "The ERP pricing engine should have optional inventory-aware pricing (e.g., surge pricing when stock is low). Discuss with client whether this cross-reference is intentional business logic or just a convenience formula.", severity: "warning" },
  { type: "surprise", field: "Data Staleness Pattern", dataEvidence: "The 'Last Updated' column in the Inventory sheet shows dates ranging from 2024-01-12 to 2024-01-14 (2-day spread). This confirms the client's complaint about 'lag' and quantifies it at 1-2 business days.", recommendation: "The ERP must enforce real-time updates. Consider event-driven architecture (webhook on stock change) rather than batch updates.", severity: "info" },
];

const mockNormalization: NormalizationRecommendation[] = [
  {
    sourceDescription: "The Pricing Matrix flattens Product, Price Rule, and Discount Tier data into a single sheet.",
    sourceArtifact: "Pricing Matrix",
    proposedEntities: [
      { name: "Product", linkedBy: "SKU (Primary Key)" },
      { name: "Price_Rule", linkedBy: "product_id FK + region" },
      { name: "Discount_Tier", linkedBy: "price_rule_id FK + tier_level" },
    ],
    rationale: "The current flat structure duplicates product info across regions. Normalizing into 3 tables allows: (1) adding new discount tiers without schema changes, (2) per-region pricing rules, (3) clean separation of product catalog from pricing logic.",
  },
  {
    sourceDescription: "The Master Inventory Sheet flattens Product and Warehouse-specific inventory into a single sheet.",
    sourceArtifact: "Master Inventory",
    proposedEntities: [
      { name: "Product", linkedBy: "SKU (shared with Pricing)" },
      { name: "Warehouse", linkedBy: "warehouse_code (Primary Key)" },
      { name: "Inventory_Record", linkedBy: "product_id FK + warehouse_id FK (Composite Key)" },
    ],
    rationale: "Product Name is duplicated across rows. Warehouse should be its own entity to support adding new locations. The composite key (SKU + Warehouse) becomes a proper junction table.",
  },
];

export const mockPhase2Data: Phase2Data = {
  artifacts: [
    {
      id: "art-1",
      name: "Pricing Matrix Spreadsheet",
      fileName: "pricing_matrix_2024.xlsx",
      headers: ["SKU", "Product Name", "Category", "Base Price", "Tier 1 Qty", "Tier 1 Discount", "Tier 2 Qty", "Tier 2 Discount", "Margin Multiplier", "Region"],
      sampleRows: [
        { SKU: "WDG-001", "Product Name": "Widget Alpha", Category: "Widgets", "Base Price": "$24.99", "Tier 1 Qty": "100", "Tier 1 Discount": "5%", "Tier 2 Qty": "500", "Tier 2 Discount": "12%", "Margin Multiplier": "1.35", Region: "Northeast" },
        { SKU: "WDG-002", "Product Name": "Widget Beta", Category: "Widgets", "Base Price": "$18.50", "Tier 1 Qty": "100", "Tier 1 Discount": "5%", "Tier 2 Qty": "500", "Tier 2 Discount": "10%", "Margin Multiplier": "1.40", Region: "Northeast" },
        { SKU: "GDG-001", "Product Name": "Gadget Pro", Category: "Gadgets", "Base Price": "$149.99", "Tier 1 Qty": "50", "Tier 1 Discount": "8%", "Tier 2 Qty": "200", "Tier 2 Discount": "15%", "Margin Multiplier": "1.25", Region: "All" },
        { SKU: "GDG-002", "Product Name": "Gadget Lite", Category: "Gadgets", "Base Price": "$89.99", "Tier 1 Qty": "50", "Tier 1 Discount": "7%", "Tier 2 Qty": "200", "Tier 2 Discount": "12%", "Margin Multiplier": "1.30", Region: "All" },
      ],
      formulasFound: [
        "=IF(D2>500, Base_Price*(1-Tier2_Discount)*Margin, IF(D2>100, Base_Price*(1-Tier1_Discount)*Margin, Base_Price*Margin))",
        "=VLOOKUP(SKU, Inventory!A:D, 4, FALSE)",
        "=IF(Region=\"Northeast\", Base_Price*1.05, IF(Region=\"West\", Base_Price*0.98, Base_Price))",
      ],
      dataTypes: { SKU: "string", "Product Name": "string", Category: "enum", "Base Price": "currency", "Tier 1 Qty": "integer", "Tier 1 Discount": "percentage", "Tier 2 Qty": "integer", "Tier 2 Discount": "percentage", "Margin Multiplier": "decimal", Region: "enum" },
      entityRelationships: [
        "Product (SKU) → Price_Rule (one-to-many, per region)",
        "Price_Rule → Discount_Tier (one-to-many)",
        "Product (SKU) → Inventory_Record (via VLOOKUP cross-reference)",
      ],
    },
    {
      id: "art-2",
      name: "Master Inventory Sheet",
      fileName: "master_inventory_q4.xlsx",
      headers: ["SKU", "Product Name", "Warehouse", "Qty On Hand", "Reserved", "Available", "Reorder Point", "Last Updated"],
      sampleRows: [
        { SKU: "WDG-001", "Product Name": "Widget Alpha", Warehouse: "WH-East", "Qty On Hand": "2,450", Reserved: "300", Available: "2,150", "Reorder Point": "500", "Last Updated": "2024-01-14" },
        { SKU: "WDG-001", "Product Name": "Widget Alpha", Warehouse: "WH-Central", "Qty On Hand": "1,200", Reserved: "150", Available: "1,050", "Reorder Point": "300", "Last Updated": "2024-01-13" },
        { SKU: "WDG-001", "Product Name": "Widget Alpha", Warehouse: "WH-West", "Qty On Hand": "800", Reserved: "0", Available: "800", "Reorder Point": "200", "Last Updated": "2024-01-14" },
        { SKU: "GDG-001", "Product Name": "Gadget Pro", Warehouse: "WH-East", "Qty On Hand": "340", Reserved: "85", Available: "255", "Reorder Point": "100", "Last Updated": "2024-01-12" },
      ],
      formulasFound: [
        "=Qty_On_Hand - Reserved (Available column is calculated)",
        "=IF(Available < Reorder_Point, \"REORDER\", \"OK\")",
        "=SUMIF(Warehouse, \"WH-*\", Qty_On_Hand)",
      ],
      dataTypes: { SKU: "string", "Product Name": "string", Warehouse: "enum", "Qty On Hand": "integer", Reserved: "integer", Available: "calculated", "Reorder Point": "integer", "Last Updated": "date" },
      entityRelationships: [
        "Product (SKU) → Inventory_Record (one-to-many, per warehouse)",
        "Warehouse → Inventory_Record (one-to-many)",
        "Inventory_Record.Available = Qty_On_Hand - Reserved (derived field)",
      ],
    },
  ],
  schemas: mockSchemas,
  logicAnalysis: mockLogicAnalysis,
  contextValidation: mockContextValidation,
  normalization: mockNormalization,
  validationResults: [
    { field: "SKU", status: "match", message: "Found in both Pricing Matrix and Inventory Sheet — confirmed as primary product identifier" },
    { field: "Base Price", status: "match", message: "Pricing Matrix contains base prices as expected from transcript" },
    { field: "Volume Discount Tiers", status: "match", message: "Two-tier discount structure found (Tier 1 and Tier 2) with quantity thresholds" },
    { field: "Margin Multiplier", status: "match", message: "Per-product margin multipliers confirmed in Pricing Matrix" },
    { field: "Region Pricing", status: "match", message: "Regional price adjustments found via formula (Northeast +5%, West -2%)" },
    { field: "Warehouse Location", status: "match", message: "Three warehouses confirmed: WH-East, WH-Central, WH-West" },
    { field: "Reorder Point", status: "match", message: "Fixed reorder points per product per warehouse — answers open question about reorder logic" },
    { field: "Vendor Information", status: "mismatch", message: "No vendor data found in uploaded files — separate vendor list may exist" },
    { field: "Customer Data", status: "mismatch", message: "No customer records in uploaded files — need to clarify data source" },
    { field: "Cross-Sheet VLOOKUP", status: "extra", message: "Pricing Matrix references Inventory sheet via VLOOKUP — confirms tight coupling between pricing and stock" },
  ],
};

// ─── Phase 3 Enhanced Mock Data ────────────────────────

const mockProjectOverview: ProjectOverview = {
  objective: "Build a unified ERP platform that replaces the client's fragmented Excel-based inventory, pricing, and order management workflows with a real-time, auditable system supporting multi-warehouse operations, tiered pricing with regional adjustments, and automated procurement triggers.",
  scopeIn: [
    "Real-time multi-warehouse inventory management (WH-East, WH-Central, WH-West)",
    "Pricing engine replicating Pricing Matrix logic (tiered discounts, margin multipliers, regional adjustments)",
    "Order-to-Cash (O2C) workflow with $10K approval routing",
    "Procure-to-Pay (P2P) workflow with automatic PO generation",
    "Audit trail for all price overrides and discount approvals",
    "Monthly sales reporting by region and product category",
    "Data migration from existing Pricing Matrix and Inventory spreadsheets",
    "Role-based access control (Sales Rep, Sales Manager, Warehouse Manager, Procurement Officer)",
  ],
  scopeOut: [
    "Customer-facing self-service portal (Phase 2 of engagement)",
    "Shipping carrier integration (not discussed in meeting)",
    "Accounting/ERP integration (QuickBooks, SAP — not mentioned)",
    "Mobile application (desktop-first for Phase 1)",
    "Advanced analytics / ML-based demand forecasting",
    "Multi-currency support (single currency assumed)",
  ],
};

const mockArchitecture: ArchitectureSpec = {
  entities: [
    { name: "Product", module: "Core", attributes: [{ name: "sku", type: "Varchar(20)", constraint: "PRIMARY KEY" }, { name: "name", type: "Varchar(255)" }, { name: "category", type: "Enum('Widgets','Gadgets')" }] },
    { name: "Price_Rule", module: "Pricing", attributes: [{ name: "id", type: "UUID", constraint: "PRIMARY KEY" }, { name: "product_id", type: "Varchar(20)", constraint: "FK → Product.sku" }, { name: "region", type: "Enum('Northeast','West','All')" }, { name: "base_price", type: "Decimal(10,2)" }, { name: "margin_multiplier", type: "Decimal(4,2)" }] },
    { name: "Discount_Tier", module: "Pricing", attributes: [{ name: "id", type: "UUID", constraint: "PRIMARY KEY" }, { name: "price_rule_id", type: "UUID", constraint: "FK → Price_Rule.id" }, { name: "min_qty", type: "Integer" }, { name: "discount_pct", type: "Decimal(5,4)" }] },
    { name: "Warehouse", module: "Inventory", attributes: [{ name: "code", type: "Varchar(20)", constraint: "PRIMARY KEY" }, { name: "name", type: "Varchar(100)" }, { name: "location", type: "Varchar(255)" }] },
    { name: "Inventory_Record", module: "Inventory", attributes: [{ name: "product_id", type: "Varchar(20)", constraint: "FK → Product.sku" }, { name: "warehouse_id", type: "Varchar(20)", constraint: "FK → Warehouse.code" }, { name: "qty_on_hand", type: "Integer" }, { name: "reserved", type: "Integer" }, { name: "reorder_point", type: "Integer" }] },
    { name: "Customer", module: "CRM", attributes: [{ name: "id", type: "UUID", constraint: "PRIMARY KEY" }, { name: "name", type: "Varchar(255)" }, { name: "region", type: "Varchar(50)" }, { name: "contact_email", type: "Varchar(255)" }] },
    { name: "Order", module: "O2C", attributes: [{ name: "id", type: "UUID", constraint: "PRIMARY KEY" }, { name: "customer_id", type: "UUID", constraint: "FK → Customer.id" }, { name: "status", type: "Enum('Draft','Pending_Approval','Confirmed','Fulfilled','Invoiced')" }, { name: "total", type: "Decimal(12,2)" }, { name: "requires_approval", type: "Boolean" }, { name: "approved_by", type: "UUID", constraint: "FK → User.id, NULLABLE" }] },
    { name: "Order_Line_Item", module: "O2C", attributes: [{ name: "id", type: "UUID", constraint: "PRIMARY KEY" }, { name: "order_id", type: "UUID", constraint: "FK → Order.id" }, { name: "product_id", type: "Varchar(20)", constraint: "FK → Product.sku" }, { name: "quantity", type: "Integer" }, { name: "unit_price", type: "Decimal(10,2)" }, { name: "discount_applied", type: "Decimal(5,4)" }] },
    { name: "Vendor", module: "P2P", attributes: [{ name: "id", type: "UUID", constraint: "PRIMARY KEY" }, { name: "name", type: "Varchar(255)" }, { name: "approved", type: "Boolean" }, { name: "lead_time_days", type: "Integer" }] },
    { name: "Purchase_Order", module: "P2P", attributes: [{ name: "id", type: "UUID", constraint: "PRIMARY KEY" }, { name: "vendor_id", type: "UUID", constraint: "FK → Vendor.id" }, { name: "status", type: "Enum('Draft','Sent','Acknowledged','Received')" }, { name: "expected_date", type: "Date" }] },
    { name: "Audit_Log", module: "Compliance", attributes: [{ name: "id", type: "UUID", constraint: "PRIMARY KEY" }, { name: "entity_type", type: "Varchar(50)" }, { name: "entity_id", type: "Varchar(50)" }, { name: "action", type: "Varchar(50)" }, { name: "user_id", type: "UUID", constraint: "FK → User.id" }, { name: "details", type: "JSONB" }, { name: "created_at", type: "Timestamp" }] },
  ],
  relationships: [
    { from: "Product", to: "Price_Rule", type: "one-to-many", label: "has pricing rules" },
    { from: "Price_Rule", to: "Discount_Tier", type: "one-to-many", label: "has discount tiers" },
    { from: "Product", to: "Inventory_Record", type: "one-to-many", label: "stocked at" },
    { from: "Warehouse", to: "Inventory_Record", type: "one-to-many", label: "contains" },
    { from: "Customer", to: "Order", type: "one-to-many", label: "places" },
    { from: "Order", to: "Order_Line_Item", type: "one-to-many", label: "contains" },
    { from: "Product", to: "Order_Line_Item", type: "one-to-many", label: "ordered as" },
    { from: "Vendor", to: "Purchase_Order", type: "one-to-many", label: "receives" },
  ],
};

const mockUserFlows: UserFlow[] = [
  {
    name: "Create Quote & Order (O2C Happy Path)",
    description: "The core order-to-cash workflow from customer request to order confirmation.",
    steps: [
      { step: 1, action: "Receive customer product request and enter into ERP", actor: "Sales Rep" },
      { step: 2, action: "System auto-calculates price using verified formula", actor: "System", formula: "IF(qty > Tier2_Qty, Base_Price × (1 - Tier2_Discount) × Margin, IF(qty > Tier1_Qty, Base_Price × (1 - Tier1_Discount) × Margin, Base_Price × Margin))" },
      { step: 3, action: "System applies regional price adjustment", actor: "System", formula: "IF(Region = 'Northeast', price × 1.05, IF(Region = 'West', price × 0.98, price))" },
      { step: 4, action: "System checks real-time inventory across all warehouses", actor: "System", formula: "Available = Qty_On_Hand - Reserved; must be ≥ order quantity" },
      { step: 5, action: "Route order for approval if threshold exceeded", actor: "System", condition: "Order total > $10,000" },
      { step: 6, action: "Review and approve/reject order", actor: "Sales Manager", condition: "Only when order total > $10,000" },
      { step: 7, action: "System reserves stock atomically and updates inventory", actor: "System", formula: "Reserved += order_qty; Available = Qty_On_Hand - Reserved" },
      { step: 8, action: "Order status updated to 'Confirmed', audit log entry created", actor: "System" },
    ],
    permissions: [
      { role: "Sales Rep", actions: ["Create quote", "Submit order", "View order status", "View inventory (read-only)"] },
      { role: "Sales Manager", actions: ["All Sales Rep actions", "Approve/reject orders > $10K", "Override pricing", "View sales reports"] },
      { role: "Warehouse Manager", actions: ["View inventory", "Update stock counts", "Process goods receipt", "Manage reservations"] },
      { role: "Procurement Officer", actions: ["Create Purchase Orders", "Manage vendor catalog", "Track inbound shipments"] },
    ],
  },
  {
    name: "Automatic Reorder (P2P Trigger)",
    description: "Automated procurement workflow triggered when inventory falls below reorder point.",
    steps: [
      { step: 1, action: "System detects Available < Reorder_Point after stock reservation", actor: "System", formula: "IF(Available < Reorder_Point, trigger_reorder)" },
      { step: 2, action: "System generates draft Purchase Order for the product", actor: "System" },
      { step: 3, action: "Procurement Officer reviews and sends PO to approved vendor", actor: "Procurement Officer" },
      { step: 4, action: "Vendor acknowledges PO, status updated to 'Acknowledged'", actor: "System" },
      { step: 5, action: "Goods received at warehouse, Warehouse Manager confirms receipt", actor: "Warehouse Manager" },
      { step: 6, action: "System updates inventory: Qty_On_Hand += received_qty", actor: "System", formula: "Qty_On_Hand += received_qty; Available recalculated" },
    ],
    permissions: [
      { role: "System", actions: ["Detect low stock", "Generate draft PO", "Update inventory on receipt"] },
      { role: "Procurement Officer", actions: ["Review draft PO", "Send to vendor", "Track shipment"] },
      { role: "Warehouse Manager", actions: ["Confirm goods receipt", "Verify quantities"] },
    ],
  },
];

const mockMigrationPlan: MigrationPlan = {
  mappings: [
    {
      sourceSheet: "Pricing Matrix (pricing_matrix_2024.xlsx)",
      targetTable: "Product + Price_Rule + Discount_Tier",
      estimatedRows: "~200 SKUs × 3 regions = ~600 price rules",
      cleanupNotes: [
        "Strip '$' prefix from Base Price column — convert to Decimal",
        "Convert percentage strings ('5%') to decimal (0.05)",
        "Split flat rows into 3 normalized tables during import",
        "Validate Region values against allowed Enum set",
      ],
      status: "needs_cleanup",
    },
    {
      sourceSheet: "Master Inventory (master_inventory_q4.xlsx)",
      targetTable: "Warehouse + Inventory_Record",
      estimatedRows: "~200 SKUs × 3 warehouses = ~600 records",
      cleanupNotes: [
        "Remove commas from numeric fields (e.g., '2,450' → 2450)",
        "Drop 'Available' column — will be computed in ERP",
        "Extract unique Warehouse values to seed Warehouse table",
        "Verify Last Updated dates are valid timestamps",
      ],
      status: "needs_cleanup",
    },
  ],
  importOrder: [
    "1. Warehouse (seed 3 warehouse records)",
    "2. Product (extract unique SKUs from Pricing Matrix)",
    "3. Price_Rule (one per product per region)",
    "4. Discount_Tier (two tiers per price rule)",
    "5. Inventory_Record (one per product per warehouse)",
    "6. Vendor (manual entry — no source data)",
    "7. Customer (manual entry — no source data)",
  ],
};

const mockConflicts: ConflictResolution[] = [
  {
    id: "conflict-1",
    clientClaim: "Client stated: 'Every order over $10,000 requires Sales Manager approval.' Implied this is an existing tracked process.",
    dataReality: "Neither spreadsheet contains any approval column, signature field, or authorization status. The approval workflow exists only as a verbal/email process with zero data trail.",
    recommendation: "Build the approval workflow from scratch in the ERP. Create an Approval_Request entity linked to Order. No legacy approval data to migrate. Implement as: Order.total > 10000 → status = 'Pending_Approval' → route to Sales Manager.",
    severity: "critical",
    resolved: false,
  },
  {
    id: "conflict-2",
    clientClaim: "Client implied orders are fulfilled completely — no mention of partial shipments or split orders.",
    dataReality: "Inventory sheet shows Reserved quantities (e.g., 85 units for Gadget Pro) that suggest partial reservations are already occurring informally.",
    recommendation: "BLOCKING: Ask client to confirm whether partial fulfillment is needed. If yes, add 'fulfilled_qty' to Order_Line_Item and support split shipments. If no, add validation: reject orders where any line item exceeds Available stock.",
    severity: "warning",
    resolved: false,
  },
  {
    id: "conflict-3",
    clientClaim: "Client mentioned 'volume discounts' generically — implied a simple discount structure.",
    dataReality: "Data reveals a sophisticated 2-tier discount system with DIFFERENT thresholds per product category (Widgets: 100/500, Gadgets: 50/200) AND per-product margin multipliers ranging from 1.25 to 1.40.",
    recommendation: "The pricing engine is more complex than the client described. Implement configurable per-product discount tiers (not global). The Discount_Tier table must support N tiers per Price_Rule, not just 2, to allow future expansion.",
    severity: "warning",
    resolved: false,
  },
  {
    id: "conflict-4",
    clientClaim: "Regional pricing was NEVER mentioned in the meeting transcript.",
    dataReality: "The Pricing Matrix contains an explicit formula: Northeast +5%, West -2%. This is active business logic affecting every price calculation.",
    recommendation: "CRITICAL: The pricing engine MUST include regional adjustments. This was a significant omission from the verbal requirements. Implement as a 'regional_modifier' field on Price_Rule. Ask client to provide the complete list of regions and their modifiers.",
    severity: "critical",
    resolved: false,
  },
];

export const mockPhase3Data: Phase3Data = {
  confidence: 87,
  generatedAt: new Date().toISOString(),
  projectOverview: mockProjectOverview,
  architecture: mockArchitecture,
  userFlows: mockUserFlows,
  migrationPlan: mockMigrationPlan,
  conflicts: mockConflicts,
  blockingQuestions: [
    "Does the ERP need to support partial shipments and split orders? (Data suggests this may already be happening)",
    "What is the complete list of regions and their price modifiers? (Only Northeast and West found in data)",
    "Where is the vendor data stored? No vendor information was found in uploaded files.",
    "Where is the customer data stored? No customer records in uploaded files — is there a separate CRM?",
    "Should the pricing engine support inventory-aware pricing? (Cross-sheet VLOOKUP suggests current coupling)",
    "What is the desired authentication method for the ERP? (SSO, email/password, etc.)",
  ],
  prdMarkdown: `# ERP Technical Specification: Unified Inventory & Order Management

## 1. Project Overview

**Objective:** Build a unified ERP platform replacing fragmented Excel workflows with real-time inventory management, automated tiered pricing with regional adjustments, and auditable order-to-cash and procure-to-pay workflows across three warehouse locations.

**Scope:** Inventory Management, Pricing Engine, Order Management (O2C), Procurement (P2P), Reporting & Compliance, Data Migration.

---

## 2. System Architecture

### 2.1 Core Entities
- **Product** (sku PK, name, category)
- **Price_Rule** (product_id FK, region, base_price, margin_multiplier)
- **Discount_Tier** (price_rule_id FK, min_qty, discount_pct)
- **Warehouse** (code PK, name, location)
- **Inventory_Record** (product_id FK, warehouse_id FK, qty_on_hand, reserved, reorder_point)
- **Customer** (id PK, name, region, contact_email)
- **Order** (id PK, customer_id FK, status Enum, total, requires_approval, approved_by FK)
- **Order_Line_Item** (order_id FK, product_id FK, quantity, unit_price, discount_applied)
- **Vendor** (id PK, name, approved, lead_time_days)
- **Purchase_Order** (id PK, vendor_id FK, status Enum, expected_date)
- **Audit_Log** (entity_type, entity_id, action, user_id FK, details JSONB, created_at)

### 2.2 Key Relationships
- Product → Price_Rule (1:N per region)
- Price_Rule → Discount_Tier (1:N per tier level)
- Product → Inventory_Record (1:N per warehouse)
- Customer → Order (1:N)
- Order → Order_Line_Item (1:N)

---

## 3. Business Logic (Verified from Spreadsheet)

### 3.1 Pricing Formula
\`\`\`
function calculatePrice(qty, basePrice, tiers, marginMultiplier, region):
  // Apply tiered discount (verified from Pricing Matrix formula)
  discount = 0
  for tier in tiers (sorted by min_qty DESC):
    if qty >= tier.min_qty:
      discount = tier.discount_pct
      break

  price = basePrice * (1 - discount) * marginMultiplier

  // Apply regional adjustment (DISCOVERED in data, not mentioned in meeting)
  if region == "Northeast": price *= 1.05
  if region == "West": price *= 0.98

  return price
\`\`\`

### 3.2 Inventory Logic
\`\`\`
Available = Qty_On_Hand - Reserved  // Verified computed field
Reorder_Trigger = Available < Reorder_Point  // Fixed per product per warehouse
\`\`\`

### 3.3 Approval Routing
\`\`\`
if Order.total > 10000:
  Order.status = "Pending_Approval"
  Order.requires_approval = true
  // Route to Sales Manager — NO legacy data exists for this workflow
\`\`\`

---

## 4. Data Migration

### Import Order (dependency-aware):
1. Warehouse (seed 3 records)
2. Product (unique SKUs from Pricing Matrix)
3. Price_Rule (per product per region)
4. Discount_Tier (2 tiers per price rule)
5. Inventory_Record (per product per warehouse)
6. Vendor (manual entry)
7. Customer (manual entry)

### Data Cleanup Required:
- Strip '$' from currency fields
- Convert percentage strings to decimals
- Remove commas from numeric fields
- Drop computed 'Available' column
- Validate all Enum values

---

## 5. Conflicts & Open Items

### Critical Conflicts:
1. **Approval Workflow:** Client described it verbally but NO data trail exists. Must build from scratch.
2. **Regional Pricing:** NEVER mentioned in meeting but EXISTS in spreadsheet formulas. Must be included.

### Blocking Questions:
- Partial shipment support needed?
- Complete list of regions and price modifiers?
- Source of vendor and customer data?
- Authentication method preference?
`,
  modules: [
    { name: "Inventory Management", description: "Real-time multi-warehouse inventory tracking with automatic reorder triggers", requirements: ["inv-1", "inv-2", "inv-3", "inv-4"], priority: "Critical" },
    { name: "Pricing Engine", description: "Configurable pricing with tiered discounts, regional adjustments, and margin multipliers", requirements: ["prc-1", "prc-2", "prc-3", "prc-4"], priority: "Critical" },
    { name: "Order Management", description: "End-to-end O2C workflow with approval routing and status tracking", requirements: ["ord-1", "ord-2", "ord-3", "ord-4"], priority: "Critical" },
    { name: "Procurement", description: "P2P workflow with vendor management and automatic PO generation", requirements: ["pro-1", "pro-2", "pro-3"], priority: "High" },
    { name: "Reporting & Compliance", description: "Sales analytics, audit trails, and compliance dashboards", requirements: ["rep-1", "rep-2", "rep-3"], priority: "High" },
  ],
  dataModel: [
    { name: "Product", fields: [{ name: "sku", type: "Varchar(20)", required: true }, { name: "name", type: "Varchar(255)", required: true }, { name: "category", type: "Enum", required: true }], relationships: ["has_many Price_Rule", "has_many Inventory_Record", "has_many Order_Line_Item"] },
    { name: "Price_Rule", fields: [{ name: "product_id", type: "FK → Product", required: true }, { name: "region", type: "Enum", required: true }, { name: "base_price", type: "Decimal(10,2)", required: true }, { name: "margin_multiplier", type: "Decimal(4,2)", required: true }], relationships: ["belongs_to Product", "has_many Discount_Tier"] },
    { name: "Order", fields: [{ name: "customer_id", type: "FK → Customer", required: true }, { name: "status", type: "Enum", required: true }, { name: "total", type: "Decimal(12,2)", required: true }, { name: "requires_approval", type: "Boolean", required: true }, { name: "approved_by", type: "FK → User", required: false }], relationships: ["belongs_to Customer", "has_many Order_Line_Item"] },
    { name: "Inventory_Record", fields: [{ name: "product_id", type: "FK → Product", required: true }, { name: "warehouse_id", type: "FK → Warehouse", required: true }, { name: "qty_on_hand", type: "Integer", required: true }, { name: "reserved", type: "Integer", required: true }, { name: "reorder_point", type: "Integer", required: true }], relationships: ["belongs_to Product", "belongs_to Warehouse"] },
    { name: "Audit_Log", fields: [{ name: "entity_type", type: "Varchar(50)", required: true }, { name: "entity_id", type: "Varchar(50)", required: true }, { name: "action", type: "Varchar(50)", required: true }, { name: "user_id", type: "FK → User", required: true }, { name: "details", type: "JSONB", required: false }], relationships: ["belongs_to User"] },
  ],
};

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Acme Corp Inventory ERP",
    clientName: "Acme Corporation",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T14:22:00Z",
    currentPhase: 3,
    status: "completed",
    phase1: mockPhase1Data,
    phase2: mockPhase2Data,
    phase3: mockPhase3Data,
  },
  {
    id: "proj-2",
    name: "TechFlow CRM Migration",
    clientName: "TechFlow Industries",
    createdAt: "2024-01-14T09:00:00Z",
    updatedAt: "2024-01-14T16:45:00Z",
    currentPhase: 2,
    status: "in_progress",
    phase1: {
      ...mockPhase1Data,
      executiveSummary: {
        goal: "Migrate legacy CRM system to modern cloud-based solution with enhanced reporting",
        painPoints: ["Legacy system downtime", "No mobile access", "Poor reporting capabilities"],
      },
    },
    phase2: null,
    phase3: null,
  },
  {
    id: "proj-3",
    name: "GreenLeaf Supply Chain",
    clientName: "GreenLeaf Organics",
    createdAt: "2024-01-13T11:15:00Z",
    updatedAt: "2024-01-13T11:15:00Z",
    currentPhase: 1,
    status: "draft",
    phase1: null,
    phase2: null,
    phase3: null,
  },
];
