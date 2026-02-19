# Phase 4 Quick Start Guide

## 🚀 What Just Got Implemented

Phase 4 automatically generates **AI implementation prompts** that you can copy and paste into Claude, ChatGPT, or Cursor to build your ERP system. Think of it as an AI-powered technical specification writer.

## 📋 Before You Start

**Apply the database migration first:**

### Option 1: Supabase Dashboard (Easiest)
1. Go to: https://dppjlzxdbsutmjcygitx.supabase.co/project/_/sql
2. Paste and run:
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase4_data JSONB;
CREATE INDEX IF NOT EXISTS idx_projects_phase4_data ON projects USING GIN (phase4_data);
```

### Option 2: Command Line
```bash
supabase db push
```

## 🎯 How to Use Phase 4

### Step 1: Complete Phase 1-3 (if not already done)
```bash
npm run dev
```

1. Create a new project
2. Enter a meeting transcript (Phase 1)
3. Upload artifacts (Phase 2)
4. Review PRD (Phase 3)

### Step 2: Generate Implementation Prompts

After Phase 3 completes, you'll see a purple button:

**"✨ Generate Implementation Prompts"**

Click it! (Takes 10-20 seconds)

### Step 3: Explore Your Prompts

You'll see 6 tabs:

#### 📊 Overview Tab
- See total prompts generated (11+ prompts)
- View implementation order (what to build first)
- Track progress (how many prompts you've used)
- See estimated implementation time

#### 🗄️ Database Tab (3 prompts)
- Schema Definition (create database tables)
- Migrations (database migration scripts)
- Seed Data (sample data for testing)

#### ⚙️ Backend Tab (Module prompts)
- API Endpoints for each module
- Business Logic implementation
- Unit tests

#### 🎨 Frontend Tab (Module prompts)
- UI Components for each module
- Forms and validation
- State management

#### 🔗 Integration Tab (5 prompts)
- Authentication (JWT, OAuth)
- Authorization (RBAC)
- API Client (Frontend connection)
- Error Handling (centralized errors)
- Data Migration (import legacy data)

#### 🧪 Testing Tab (3 prompts)
- Unit Tests
- Integration Tests
- E2E Tests (Playwright)

### Step 4: Use a Prompt

1. **Navigate to a prompt** (e.g., Database → Schema Definition)
2. **Click "Show Prompt"** to expand
3. **Click "Copy Prompt"** button
4. **Open Claude/ChatGPT/Cursor**
5. **Paste the prompt** and hit Enter
6. **Copy the generated code** from AI
7. **Return to Phase 4** and click "Mark as Used" ✓

### Step 5: Follow Implementation Order

The **Overview tab** shows the recommended order:

```
1. database-schema          (Start here!)
2. database-migrations
3. database-seed
4. integration-auth         (Critical Path)
5. integration-authz        (Critical Path)
6. [Your module APIs]
7. [Your module UIs]
8. integration-migration
9. testing-unit
10. testing-integration
11. testing-e2e
```

**Red badges = Critical Path** (must complete these for system to work)

## 🎨 Customize Tech Stack

Don't like Node.js? Want to use Django instead?

1. Click **"Configure Tech Stack"** button
2. Choose your preferences:
   - **Backend:** Node.js, Django, FastAPI, ASP.NET Core
   - **Database:** PostgreSQL, MySQL, MongoDB, SQL Server
   - **ORM:** Prisma, TypeORM, SQLAlchemy, Entity Framework
   - **Frontend:** React, Vue, Angular, Svelte
   - **UI Library:** Material-UI, Ant Design, Chakra UI, Tailwind
   - **Authentication:** JWT, OAuth2, Auth0, Supabase Auth
3. Click **"Save & Regenerate"**
4. Confirm regeneration
5. All prompts update to use your chosen stack! 🎉

## 💡 Pro Tips

### Tip 1: Copy-Paste Workflow
```
Phase 4 Prompt → Copy → Claude/ChatGPT → Generate Code → Copy Code → Your IDE → Commit
```

### Tip 2: Track Your Progress
- Mark prompts as "Used" after implementing
- Progress bar shows completion percentage
- Gray prompts = not started
- Blue prompts with ✓ = completed

### Tip 3: Export for Team
- Click **"Export"** on individual prompts → saves as `.txt`
- Click **"Export All"** → downloads all prompts
- Share with your team for parallel development

### Tip 4: Dependencies Matter
Some prompts are blocked until dependencies complete:
- 🟡 Yellow border = dependencies not met (can't use yet)
- ⚠️ Warning shows which prompts to complete first

### Tip 5: Example Prompt Structure
Each prompt includes:
- **ROLE:** "You are a Senior Backend Engineer..."
- **OBJECTIVE:** "Generate REST API for Inventory Management"
- **CONTEXT FROM PRD:** Entities, business rules, user flows
- **TECHNICAL REQUIREMENTS:** Framework, security, performance
- **OUTPUT SPECIFICATION:** Exact file paths and structure
- **VERIFICATION CRITERIA:** How to test the code

## 🐛 Troubleshooting

### "Generate Implementation Prompts" button doesn't appear
- Make sure Phase 3 completed successfully
- Check that phase3Data is not null
- Refresh the page

### Prompts are generic/mock data
- AWS Bedrock not configured
- Set AWS credentials in `.env` file
- See `ENABLE_REAL_AI.md` for setup

### Can't mark prompt as used
- Check if dependencies are met (yellow border?)
- Complete dependent prompts first
- Check implementation order in Overview tab

### Export doesn't download
- Check browser download settings
- Try a different browser
- Check console for errors

## 📊 What You Get

For a typical ERP project, Phase 4 generates:

- **11-20 prompts** (depending on modules)
- **~40,000-80,000 tokens** of AI prompts
- **2,000-8,000 chars** per prompt
- **3-4 weeks** estimated implementation time

Each prompt is **production-ready** and includes:
- Proper error handling
- Security best practices (OWASP)
- Input validation
- Performance optimization hints
- Testing criteria

## 🎯 Real-World Example

**Scenario:** You completed Phase 3 for an Inventory Management ERP.

**Phase 4 generates:**
1. Database schema with Products, Warehouses, Inventory tables
2. Authentication system with JWT
3. Inventory API with endpoints:
   - `GET /api/inventory/products/:id/availability`
   - `POST /api/inventory/reserve`
   - `POST /api/inventory/release`
4. Frontend components:
   - Inventory Dashboard
   - Stock Level Cards
   - Reorder Alerts
5. Migration script to import existing Excel inventory data
6. Tests to verify stock reservation logic

**You then:**
1. Copy Database Schema prompt → Claude generates Prisma schema
2. Copy Inventory API prompt → Claude generates Express routes + controllers
3. Copy Frontend prompt → Claude generates React components
4. Copy Migration prompt → Claude generates data import script
5. Run tests, deploy, done! 🚀

## 🎉 That's It!

You now have an **AI-powered implementation assistant** that turns your PRD into actionable, copy-paste prompts.

**Happy coding!** 🚀

---

**Need help?** Check:
- `PHASE4_IMPLEMENTATION_SUMMARY.md` for technical details
- `PHASE4_PROGRESS_DESIGN.md` for original design doc
- GitHub Issues for bug reports
