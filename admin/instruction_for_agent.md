# AI Agent Instructions - Physicsium Project

**CRITICAL: This document contains standardized implementations and architectural decisions. AI agents MUST follow these patterns consistently. Do NOT create alternative implementations.**

---

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Database Models](#database-models)
4. [API Endpoints](#api-endpoints)
5. [Admin Dashboard Functionality](#admin-dashboard-functionality)
6. [Simulation Management System](#simulation-management-system)
7. [Unit Visibility System](#unit-visibility-system)
8. [Auto-Discovery System](#auto-discovery-system)
9. [Coding Standards](#coding-standards)
10. [What NOT to Do](#what-not-to-do)

---

## Project Architecture

### Technology Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Environment: `.env` for local, production env vars on Render

**Frontend:**
- Vue.js 3 with Composition API
- Vue Router
- Axios for API calls
- Vite build tool

**Admin Dashboard:**
- Vue.js 3 + TypeScript
- Pinia for state management
- Axios for API calls
- Lucide Icons

### Directory Structure

```
physicsium-vue/
├── backend/
│   ├── controllers/
│   │   └── adminController.js      # Admin CRUD operations
│   ├── models/
│   │   ├── User.js                 # User schema
│   │   ├── Simulation.js           # Simulation schema
│   │   └── Unit.js                 # Unit schema
│   ├── routes/
│   │   ├── adminRoutes.js          # Admin API routes
│   │   ├── unitRoutes.js           # Public unit routes
│   │   └── simulationRoutes.js     # Public simulation routes
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT + role-based auth
│   │   └── sanitize.js             # Input validation
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── unit/
│   │   │       ├── kinematics/labs/    # Kinematics simulations
│   │   │       ├── electrostatics/     # Electrostatics simulations
│   │   │       └── gravitation/labs/   # Gravitation simulations
│   │   ├── views/
│   │   │   └── course/
│   │   │       └── Topics.vue      # Main topics page (uses visibility API)
│   │   ├── data/
│   │   │   └── jee-syllabus.js     # Source of truth for units
│   │   └── router/
│   │       └── index.js
│   └── simulation_instructions.md  # Guide for adding simulations
└── admin/
    ├── src/
    │   ├── stores/
    │   │   └── admin.ts            # Pinia store for admin data
    │   ├── views/
    │   │   ├── SimulationManagement.vue
    │   │   └── UnitManagement.vue
    │   └── router/
    └── instruction_for_agent.md    # This file
```

---

## Authentication & Authorization

### User Roles (Hierarchical)

```
user → manager → owner
```

**Permissions:**
- `user`: Basic access, can view content
- `manager`: Can manage simulations, view users, reset passwords
- `owner`: Full access, can manage roles, delete users, sync data

### Middleware Usage

**Always use this pattern for protected routes:**

```javascript
const { protect, authorize } = require('../middleware/authMiddleware');

// Manager and Owner
router.get('/resource', protect, authorize('manager', 'owner'), controller);

// Owner only
router.post('/critical', protect, authorize('owner'), controller);
```

### JWT Token Structure

```javascript
{
  id: user._id,
  role: 'manager' | 'owner' | 'user'
}
```

**Token stored in:**
- Frontend: `localStorage.getItem('token')`
- Admin: Pinia auth store

---

## Database Models

### 1. Simulation Model

**File:** `backend/models/Simulation.js`

```javascript
{
  simulationId: {
    type: String,
    required: true,
    unique: true,
    // Format: "kebab-case" (e.g., "frame-of-reference")
  },
  name: {
    type: String,
    required: true
    // Format: "Title Case" (e.g., "Frame Of Reference")
  },
  category: {
    type: String,
    required: true,
    enum: ['kinematics', 'electrostatics', 'gravitation', 'experimental']
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}
```

### 2. Unit Model

**File:** `backend/models/Unit.js`

```javascript
{
  unitId: {
    type: String,
    required: true,
    unique: true
    // Format: "unit-1", "unit-2", etc.
  },
  unitNumber: {
    type: String,
    required: true
    // Format: "UNIT 1", "UNIT 2", etc.
  },
  title: {
    type: String,
    required: true
    // English title
  },
  title_hi: {
    type: String,
    required: true
    // Hindi translation
  },
  category: {
    type: String,
    enum: ['mechanics', 'thermodynamics', 'electromagnetism', 'optics', 'modern-physics', 'other']
  },
  hasSimulations: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}
```

### 3. User Model

**File:** `backend/models/User.js`

```javascript
{
  name: String,
  email: String (unique, lowercase),
  password: String (hashed with bcrypt),
  role: {
    type: String,
    enum: ['user', 'manager', 'owner'],
    default: 'user'
  },
  isRestricted: {
    type: Boolean,
    default: false
  }
}
```

---

## API Endpoints

### Public Endpoints

**Simulations:**
```
GET /api/simulations/hidden
→ Returns: { success: true, data: ["sim-id-1", "sim-id-2"] }
→ Purpose: Frontend gets list of hidden simulation IDs for filtering
```

**Units:**
```
GET /api/units/visible
→ Returns: { success: true, data: ["unit-1", "unit-2"] }
→ Purpose: Frontend gets list of visible unit IDs for filtering
```

### Admin Endpoints (Protected)

**Simulations:**
```
GET  /api/admin/simulations
→ Auth: manager, owner
→ Returns all simulations with visibility status

PUT  /api/admin/simulations/:id/toggle
→ Auth: manager, owner
→ Toggles isVisible boolean
→ Returns updated simulation

POST /api/admin/simulations/sync
→ Auth: owner
→ Manual sync from predefined list
→ Creates/updates simulations

POST /api/admin/simulations/auto-discover
→ Auth: manager, owner
→ Scans component folders and auto-syncs
→ Returns: { created, updated, total }
```

**Units:**
```
GET  /api/admin/units
→ Auth: manager, owner
→ Returns all units sorted by unitNumber

PUT  /api/admin/units/:id/toggle
→ Auth: manager, owner
→ Toggles unit visibility
→ Returns updated unit

POST /api/admin/units/sync
→ Auth: owner
→ Syncs units from frontend jee-syllabus.js
→ Creates/updates units
```

**Users:**
```
GET    /api/admin/users
GET    /api/admin/users/:id
PUT    /api/admin/users/:id/restrict
PUT    /api/admin/users/:id/role          (owner only)
PUT    /api/admin/users/:id/reset-password
DELETE /api/admin/users/:id               (owner only)
```

---

## Admin Dashboard Functionality

### Pinia Store Pattern

**File:** `admin/src/stores/admin.ts`

**State Structure:**
```typescript
interface AdminState {
  simulations: Simulation[]
  units: Unit[]
  error: string | null
}
```

**Actions (MUST follow this pattern):**

```typescript
// Fetch data
async fetchSimulations() {
  const response = await axios.get(`${API_URL}/admin/simulations`)
  this.simulations = response.data.data
}

// Toggle visibility
async toggleSimulation(id: string) {
  const response = await axios.put(`${API_URL}/admin/simulations/${id}/toggle`)
  const updatedSim = response.data.data
  const index = this.simulations.findIndex(s => s._id === id)
  if (index !== -1) {
    this.simulations[index] = updatedSim  // Update locally
  }
  return true
}

// Sync/Create
async syncSimulations(simulations: any[]) {
  await axios.post(`${API_URL}/admin/simulations/sync`, { simulations })
  await this.fetchSimulations()  // Refresh after sync
  return true
}
```

### Component Pattern

**MUST follow this lifecycle:**

```vue
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useAdminStore } from '../stores/admin'

const adminStore = useAdminStore()
const activeCategory = ref('all')

// 1. Fetch on mount
onMounted(async () => {
  await adminStore.fetchSimulations()
})

// 2. Filter with computed
const filteredItems = computed(() => {
  if (activeCategory.value === 'all') return adminStore.simulations
  return adminStore.simulations.filter(s => s.category === activeCategory.value)
})

// 3. Actions call store methods
const handleToggle = async (id: string) => {
  await adminStore.toggleSimulation(id)
}
</script>
```

### Icons (Use Lucide)

**Installed:** `lucide-vue-next`

```vue
import { Eye, EyeOff, RefreshCw, BookOpen } from 'lucide-vue-next'
```

**Common icons:**
- `Eye` / `EyeOff` - Visibility toggle
- `RefreshCw` - Sync/refresh
- `BookOpen` - Units
- `Beaker` - Simulations
- `Users` - User management

---

## Simulation Management System

### Auto-Discovery Process

**CRITICAL: This is the ONLY way to add simulations. Do NOT create manual alternatives.**

**1. Backend Auto-Discovery Script**

**File:** `backend/autoSyncSimulations.js`

```javascript
const simulationPaths = {
  kinematics: '../frontend/src/components/unit/kinematics/labs',
  electrostatics: '../frontend/src/components/unit/electrostatics',
  gravitation: '../frontend/src/components/unit/gravitation/labs',
}

// Scans folders for *Lab.vue or *Motion.vue files
// Converts filename to simulationId and name
// Creates/updates in database
```

**2. Controller Method**

**File:** `backend/controllers/adminController.js`

```javascript
const autoDiscoverSimulations = asyncHandler(async (req, res) => {
  // Same logic as autoSyncSimulations.js
  // Returns: { created, updated, total }
})
```

**3. Admin Integration**

Admin dashboard calls auto-discover on mount (silent):

```typescript
onMounted(async () => {
  await adminStore.fetchSimulations()
  // Auto-discover new simulations
  await adminStore.autoDiscoverSimulations()
  await adminStore.fetchSimulations()  // Refresh
})
```

### Filename to ID Conversion

**Algorithm (DO NOT CHANGE):**

```javascript
// Input: "FrameOfReferenceLab.vue"
const simulationId = filename
  .replace('Lab.vue', '')
  .replace('.vue', '')
  .replace(/([A-Z])/g, '-$1')  // Insert dash before capitals
  .toLowerCase()
  .substring(1)  // Remove leading dash
// Output: "frame-of-reference"

const name = filename
  .replace('Lab.vue', '')
  .replace('.vue', '')
  .replace(/([A-Z])/g, ' $1')  // Insert space before capitals
  .trim()
// Output: "Frame Of Reference"
```

### Visibility Filtering (Frontend)

**Pattern for all pages displaying simulations:**

```javascript
import axios from 'axios'
import { ref, computed, onMounted } from 'vue'

const hiddenSimulations = ref([])

onMounted(async () => {
  try {
    const response = await axios.get(`${API_URL}/simulations/hidden`)
    hiddenSimulations.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch hidden simulations:', error)
  }
})

const visibleSimulations = computed(() => {
  return allSimulations.value.filter(sim => 
    !hiddenSimulations.value.includes(sim.simulationId)
  )
})
```

---

## Unit Visibility System

### Source of Truth

**CRITICAL: `frontend/src/data/jee-syllabus.js` is the single source of truth for unit data.**

**Structure:**
```javascript
export const jeeSyllabus = [
  {
    unit: 'UNIT 1',
    title: 'Units and Measurements',
    title_hi: 'मात्रक और मापन',
    content: '...',
    content_hi: '...'
  },
  // ... 19 more units
]
```

### Syncing Units

**Script:** `backend/cleanAndSync.js`

```javascript
// 1. Import from frontend
const { jeeSyllabus } = require('../frontend/src/data/jee-syllabus.js')

// 2. Clear existing units
await Unit.deleteMany({})

// 3. Create from jeeSyllabus
for (const item of jeeSyllabus) {
  await Unit.create({
    unitId: item.unit.toLowerCase().replace(/\s+/g, '-'),
    unitNumber: item.unit,
    title: item.title,
    title_hi: item.title_hi,
    category: getCategoryFromTitle(item.title),
    hasSimulations: hasSimulationsCheck(item.title)
  })
}
```

### Frontend Filtering (Topics Page)

**File:** `frontend/src/views/course/Topics.vue`

**MUST use this pattern:**

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { jeeSyllabus } from '../../data/jee-syllabus.js'

const visibleUnitIds = ref([])

onMounted(async () => {
  const response = await axios.get(`${API_URL}/units/visible`)
  visibleUnitIds.value = response.data.data || []
})

const visibleTopics = computed(() => {
  return jeeSyllabus.filter(topic => {
    const unitId = topic.unit.toLowerCase().replace(/\s+/g, '-')
    return visibleUnitIds.value.includes(unitId)
  })
})
</script>
```

### Unit Sorting

**MUST sort by numeric extraction:**

```typescript
const filteredUnits = computed(() => {
  let units = // ... filter by category
  
  return units.sort((a, b) => {
    const numA = parseInt(a.unitNumber.replace(/\D/g, '')) || 0
    const numB = parseInt(b.unitNumber.replace(/\D/g, '')) || 0
    return numA - numB
  })
})
```

---

## Auto-Discovery System

### Component Folder Scanning

**Scanned Folders:**
```
components/unit/kinematics/labs/
components/unit/electrostatics/
components/unit/gravitation/labs/
```

**File Pattern Matching:**
```javascript
if (file.endsWith('Lab.vue') || file.endsWith('Motion.vue')) {
  // Process this file
}
```

### Category Assignment

**By folder location:**
```javascript
const simulationPaths = {
  kinematics: 'path/to/kinematics/labs',        // → category: "kinematics"
  electrostatics: 'path/to/electrostatics',     // → category: "electrostatics"
  gravitation: 'path/to/gravitation/labs',      // → category: "gravitation"
}
```

### When Auto-Discovery Runs

1. **Manually:** `node backend/autoSyncSimulations.js`
2. **Admin Dashboard:** On mount (silent background sync)
3. **Manual Trigger:** "Sync Simulations" button in admin

---

## Coding Standards

### JavaScript/TypeScript

**Use:**
- ✅ `async/await` for async operations
- ✅ `const` and `let` (never `var`)
- ✅ Template literals `` `${variable}` ``
- ✅ Arrow functions `() => {}`
- ✅ Destructuring `const { data } = response`

**Error Handling:**
```javascript
try {
  const response = await api.call()
  // Success logic
} catch (error) {
  console.error('Descriptive error:', error)
  // Graceful fallback
}
```

### Vue 3 Composition API

**MUST use:**
```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

const data = ref(initialValue)
const computed = computed(() => transformation(data.value))

onMounted(async () => {
  // Initialization
})
</script>
```

**DO NOT use Options API (`data()`, `methods`, etc.)**

### API Calls

**Pattern:**
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const response = await axios.get(`${API_URL}/endpoint`)
const data = response.data.data  // Double .data is correct
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `isVisible` |
| Functions | camelCase | `fetchData()`, `handleClick()` |
| Components | PascalCase | `SimulationCard.vue` |
| Files (Vue) | PascalCase | `UnitManagement.vue` |
| Files (JS) | camelCase | `adminController.js` |
| Constants | UPPER_SNAKE | `API_URL`, `MAX_RETRIES` |
| Database IDs | kebab-case | `frame-of-reference` |

---

## What NOT to Do

### ❌ NEVER

1. **Create alternative implementations for existing systems**
   - Use auto-discovery for simulations
   - Use jee-syllabus.js for units
   - Use Pinia store pattern for admin

2. **Manually edit the database**
   - Use sync scripts or API endpoints
   - Don't insert documents directly via MongoDB

3. **Change authentication middleware**
   - Don't create custom auth logic
   - Use `protect` and `authorize` as-is

4. **Use Options API in Vue**
   - All new code must use Composition API
   - `<script setup>` is required

5. **Hardcode API URLs**
   - Use `import.meta.env.VITE_API_URL`
   - Use `process.env` in backend

6. **Skip error handling**
   - Always wrap async calls in try/catch
   - Provide fallbacks for API failures

7. **Create new state management**
   - Use existing Pinia stores
   - Don't use Vuex or local state for shared data

8. **Modify core schemas without updating**
   - If changing `Simulation` or `Unit` models, update all related code
   - Update this document

9. **Use different naming patterns**
   - Follow the naming conventions table
   - Don't mix snake_case, camelCase in same context

10. **Bypass visibility system**
    - All frontend displays MUST check visibility
    - Don't show hidden simulations/units

### ⚠️ CRITICAL RULES

1. **File naming determines simulation ID**
   - `FrameOfReferenceLab.vue` → `frame-of-reference`
   - This is automatic, don't override

2. **jee-syllabus.js is read-only source**
   - Don't modify unit data in database independently
   - Sync from this file

3. **Auto-discovery runs on admin mount**
   - Don't prevent this
   - It's designed to be lightweight

4. **Visibility defaults to true**
   - New simulations/units visible by default
   - Admin can hide them

5. **Admin roles are hierarchical**
   - `owner` > `manager` > `user`
   - Don't create peer roles

---

## Common Tasks Reference

### Adding a New Simulation

1. Create `YourSimulationLab.vue` in appropriate folder
2. Add route in `frontend/src/router/index.js`
3. Refresh admin dashboard → auto-discovered
4. Toggle visibility if needed

### Hiding a Unit

1. Admin dashboard → `/units`
2. Click eye icon to toggle
3. Frontend `/topics` will filter it out

### Syncing All Units

```bash
cd backend
node cleanAndSync.js
```

### Manual Simulation Sync

```bash
cd backend
node autoSyncSimulations.js
```

### Checking Visibility

**Simulations:**
```
GET /api/simulations/hidden
```

**Units:**
```
GET /api/units/visible
```

---

## Environment Variables

### Backend (.env)

```env
MONGO_URI=mongodb://...
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
PORT=5000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

### Admin (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Deployment Notes

**Backend:** Render
**Frontend:** Vercel
**Admin:** Vercel (separate deployment)
**Database:** MongoDB Atlas

**Environment variables must be set in respective platforms.**

---

## Summary

This document establishes the **single source of truth** for architectural decisions in the Physicsium project. When working on this codebase:

1. ✅ **Follow existing patterns** - Don't reinvent
2. ✅ **Use auto-discovery** - Don't manual sync
3. ✅ **Respect visibility system** - Always check before displaying
4. ✅ **Use Pinia stores** - Don't create local state
5. ✅ **Use jee-syllabus.js** - Single source for units
6. ✅ **Follow naming conventions** - Consistency is key

**When in doubt, refer to this document. If it's not documented here, ask before implementing.**

---

Last Updated: 2026-02-07
Maintainer: Development Team
