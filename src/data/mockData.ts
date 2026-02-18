import type { Project, Phase1Data, Phase2Data, Phase3Data } from "@/types/project";

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
        "=VLOOKUP(SKU, Inventory!A:D, 4, FALSE) — Cross-references inventory sheet",
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
        "=IF(Available < Reorder_Point, \"REORDER\", \"OK\") — Conditional formatting trigger",
        "=SUMIF(Warehouse, \"WH-*\", Qty_On_Hand) — Total across warehouses",
      ],
      dataTypes: { SKU: "string", "Product Name": "string", Warehouse: "enum", "Qty On Hand": "integer", Reserved: "integer", Available: "calculated", "Reorder Point": "integer", "Last Updated": "date" },
      entityRelationships: [
        "Product (SKU) → Inventory_Record (one-to-many, per warehouse)",
        "Warehouse → Inventory_Record (one-to-many)",
        "Inventory_Record.Available = Qty_On_Hand - Reserved (derived field)",
      ],
    },
  ],
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

export const mockPhase3Data: Phase3Data = {
  confidence: 87,
  generatedAt: new Date().toISOString(),
  prdMarkdown: `# ERP System Specification: Unified Inventory & Order Management

## 1. System Overview

This ERP solution replaces the client's fragmented Excel-based workflow with a unified platform managing **Inventory**, **Pricing & Quoting**, **Order Management (O2C)**, **Procurement (P2P)**, and **Reporting & Compliance**.

### Key Objectives
- Eliminate inventory data lag and prevent overselling
- Automate pricing calculations using imported Pricing Matrix logic
- Provide real-time order status visibility
- Ensure full audit compliance for price overrides

---

## 2. Module Specifications

### 2.1 Inventory Management
**Priority: Critical**

The system shall maintain real-time inventory records across three warehouse locations (WH-East, WH-Central, WH-West).

**Verified from Spreadsheet Analysis:**
- Available quantity = Qty On Hand - Reserved (confirmed formula)
- Fixed reorder points per product per warehouse
- Three warehouse locations confirmed

**Requirements:**
- Real-time stock tracking with automatic Available calculation
- Stock reservation on order confirmation (atomic transaction)
- Reorder alerts when Available < Reorder Point
- Multi-warehouse transfer management
- Batch import from existing Master Inventory Sheet format

### 2.2 Pricing Engine
**Priority: Critical**

The pricing engine must replicate the existing Pricing Matrix logic, including:

**Verified Pricing Formula:**
\`\`\`
IF quantity > Tier2_Qty:
  price = Base_Price × (1 - Tier2_Discount) × Margin_Multiplier
ELIF quantity > Tier1_Qty:
  price = Base_Price × (1 - Tier1_Discount) × Margin_Multiplier
ELSE:
  price = Base_Price × Margin_Multiplier

// Regional adjustment
IF Region = "Northeast": price × 1.05
IF Region = "West": price × 0.98
\`\`\`

**Requirements:**
- Configurable discount tiers per product
- Regional price adjustments
- Per-product margin multipliers
- Price override with mandatory approval and audit log
- Bulk import from existing Pricing Matrix format

### 2.3 Order Management (O2C)
**Priority: Critical**

**Requirements:**
- Digital order creation (replaces Word doc templates)
- Automatic pricing calculation at order entry
- Approval workflow: orders > $10,000 require Sales Manager approval
- Real-time order status tracking (Draft → Pending Approval → Confirmed → Fulfilled → Invoiced)
- Customer-facing order status portal
- Order history and search

### 2.4 Procurement (P2P)
**Priority: High**

**Requirements:**
- Approved vendor catalog management
- Automatic PO generation when stock falls below reorder point
- PO lifecycle tracking (Draft → Sent → Acknowledged → Received)
- Goods receipt processing with automatic inventory update
- Vendor performance tracking

### 2.5 Reporting & Compliance
**Priority: High**

**Requirements:**
- Monthly sales reports by region and product category
- Complete audit trail for price overrides and discount approvals
- Inventory turnover and fulfillment rate dashboards
- Export capabilities (PDF, CSV)

---

## 3. Data Model

### Core Entities
| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| Product | SKU (PK), name, category | → Price_Rule, → Inventory_Record |
| Price_Rule | product_id, region, base_price, margin_multiplier | → Discount_Tier |
| Discount_Tier | price_rule_id, min_qty, discount_pct | — |
| Warehouse | code (PK), name, location | → Inventory_Record |
| Inventory_Record | product_id, warehouse_id, qty_on_hand, reserved, reorder_point | — |
| Customer | id (PK), name, region, contact_info | → Order |
| Order | id (PK), customer_id, status, total, requires_approval | → Order_Line_Item, → Approval_Request |
| Order_Line_Item | order_id, product_id, quantity, unit_price, discount_applied | — |
| Purchase_Order | id (PK), vendor_id, status, expected_date | → PO_Line_Item |
| Vendor | id (PK), name, approved, lead_time | → Purchase_Order |
| Audit_Log | id, entity_type, entity_id, action, user_id, timestamp, details | — |

---

## 4. Open Items

1. **Vendor Data Source** — No vendor information found in uploaded files. Client needs to provide vendor list or confirm manual entry.
2. **Customer Database** — No customer records in uploaded files. Need to determine if a separate CRM or customer list exists.
3. **Shipping Integration** — Not discussed in meeting. Clarify if carrier integration is needed.
4. **Authentication** — User auth method not specified. Recommend SSO for enterprise deployment.
5. **Data Migration Volume** — Number of SKUs, customers, and historical orders to migrate not confirmed.
`,
  modules: [
    { name: "Inventory Management", description: "Real-time multi-warehouse inventory tracking with automatic reorder triggers", requirements: ["inv-1", "inv-2", "inv-3", "inv-4"], priority: "Critical" },
    { name: "Pricing Engine", description: "Configurable pricing with tiered discounts, regional adjustments, and margin multipliers", requirements: ["prc-1", "prc-2", "prc-3", "prc-4"], priority: "Critical" },
    { name: "Order Management", description: "End-to-end O2C workflow with approval routing and status tracking", requirements: ["ord-1", "ord-2", "ord-3", "ord-4"], priority: "Critical" },
    { name: "Procurement", description: "P2P workflow with vendor management and automatic PO generation", requirements: ["pro-1", "pro-2", "pro-3"], priority: "High" },
    { name: "Reporting & Compliance", description: "Sales analytics, audit trails, and compliance dashboards", requirements: ["rep-1", "rep-2", "rep-3"], priority: "High" },
  ],
  dataModel: [
    { name: "Product", fields: [{ name: "sku", type: "string", required: true }, { name: "name", type: "string", required: true }, { name: "category", type: "enum", required: true }], relationships: ["has_many Price_Rule", "has_many Inventory_Record", "has_many Order_Line_Item"] },
    { name: "Price_Rule", fields: [{ name: "product_id", type: "FK", required: true }, { name: "region", type: "enum", required: true }, { name: "base_price", type: "decimal", required: true }, { name: "margin_multiplier", type: "decimal", required: true }], relationships: ["belongs_to Product", "has_many Discount_Tier"] },
    { name: "Order", fields: [{ name: "customer_id", type: "FK", required: true }, { name: "status", type: "enum", required: true }, { name: "total", type: "decimal", required: true }, { name: "requires_approval", type: "boolean", required: true }], relationships: ["belongs_to Customer", "has_many Order_Line_Item", "has_one Approval_Request"] },
    { name: "Inventory_Record", fields: [{ name: "product_id", type: "FK", required: true }, { name: "warehouse_id", type: "FK", required: true }, { name: "qty_on_hand", type: "integer", required: true }, { name: "reserved", type: "integer", required: true }, { name: "reorder_point", type: "integer", required: true }], relationships: ["belongs_to Product", "belongs_to Warehouse"] },
    { name: "Audit_Log", fields: [{ name: "entity_type", type: "string", required: true }, { name: "entity_id", type: "string", required: true }, { name: "action", type: "string", required: true }, { name: "user_id", type: "FK", required: true }, { name: "details", type: "json", required: false }], relationships: ["belongs_to User"] },
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
