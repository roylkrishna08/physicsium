# Simulation Implementation Guide

This guide explains how to create new physics simulations that automatically appear in the admin dashboard and frontend.

## Quick Start

**Creating a new simulation takes 3 steps:**

1. Create the simulation component file
2. Add a route in the router
3. *(Optional)* Run auto-sync script or wait for admin reload

That's it! The system will automatically discover and register your simulation.

---

## Step-by-Step Instructions

### 1. Create Simulation Component

Create your Vue component in the appropriate category folder:

```
frontend/src/components/unit/
├── kinematics/labs/          # For kinematics simulations
│   ├── RelativeVelocityLab.vue
│   └── YourNewLab.vue        ← Add here
├── electrostatics/           # For electrostatics simulations
│   ├── DipoleLab.vue
│   └── YourNewLab.vue        ← Or here
└── gravitation/labs/         # For gravitation simulations
    ├── KeplerOrbitLab.vue
    └── YourNewLab.vue        ← Or here
```

**Naming Convention:**
- File must end with `Lab.vue` (e.g., `FrameOfReferenceLab.vue`)
- Or `Motion.vue` (e.g., `ProjectileMotion.vue`)
- Use PascalCase for the filename

**Example Component Structure:**

```vue
<script setup>
import { ref, onMounted } from 'vue'
// Your simulation logic here
</script>

<template>
  <div class="simulation-container">
    <!-- Your simulation UI -->
  </div>
</template>

<style scoped>
/* Your styles */
</style>
```

### 2. Add Route

Open `frontend/src/router/index.js` and add your route:

```javascript
{
  path: '/kinematics/frame-of-reference',
  name: 'FrameOfReference',
  component: () => import('../components/unit/kinematics/labs/FrameOfReferenceLab.vue'),
  meta: { requiresAuth: true }
}
```

**Route Path Convention:**
- Use kebab-case: `/category/simulation-name`
- Match the simulation ID that will be auto-generated

### 3. Auto-Discovery

Your simulation will be automatically discovered using one of these methods:

**Method A: Automatic (Recommended)**
- Admin dashboard auto-discovers on page load
- No manual action needed
- Refresh admin at `/simulations` to see your new simulation

**Method B: Manual Script**
Run the auto-discovery script from backend:
```bash
cd backend
node autoSyncSimulations.js
```

---

## How Auto-Discovery Works

### File Naming → Simulation ID

The system automatically generates IDs from filenames:

| Filename | Generated ID | Display Name |
|----------|--------------|--------------|
| `FrameOfReferenceLab.vue` | `frame-of-reference` | Frame Of Reference |
| `ProjectileMotion.vue` | `projectile-motion` | Projectile Motion |
| `DipoleLab.vue` | `dipole` | Dipole |

### Category Assignment

Category is determined by folder location:

```
components/unit/kinematics/labs/    → category: "kinematics"
components/unit/electrostatics/     → category: "electrostatics"
components/unit/gravitation/labs/   → category: "gravitation"
```

### Default Visibility

- **New simulations default to `isVisible: true`**
- Admins can toggle visibility in the dashboard
- Hidden simulations won't appear on frontend

---

## Admin Dashboard Features

### Viewing Simulations

Navigate to `/simulations` in admin dashboard to see:
- All discovered simulations
- Visibility status (visible/hidden)
- Category grouping
- Quick toggle controls

### Toggling Visibility

Click the eye icon (👁️) to:
- ✅ **Show** simulation on frontend
- ❌ **Hide** simulation from frontend

Changes take effect immediately on frontend after refresh.

### Manual Sync

If auto-discovery doesn't work:
1. Click "Sync Simulations" button
2. System rescans component folders
3. New simulations appear in list

---

## Unit Visibility System

### How Units Work

Units can also be enabled/disabled independently:

1. Navigate to `/units` in admin dashboard
2. Toggle unit visibility (e.g., hide "Laws of Motion")
3. Hidden units won't appear on frontend `/topics` page

### Frontend Filtering

The frontend automatically fetches visible units/simulations:
- **Topics page** (`/topics`): Shows only enabled units
- **Experiments page** (`/experiments`): Shows only enabled simulations
- **Unit pages**: Show only enabled sub-simulations

---

## Database Schema

### Simulation Model

```javascript
{
  simulationId: String,  // Auto: "frame-of-reference"
  name: String,          // Auto: "Frame Of Reference"
  category: String,      // Auto: "kinematics"
  isVisible: Boolean     // Default: true
}
```

### Unit Model

```javascript
{
  unitId: String,        // e.g., "unit-2"
  unitNumber: String,    // e.g., "UNIT 2"
  title: String,         // e.g., "Kinematics"
  title_hi: String,      // Hindi translation
  category: String,      // e.g., "mechanics"
  hasSimulations: Boolean,
  isVisible: Boolean
}
```

---

## API Endpoints

### Public (Frontend)

```javascript
GET /api/simulations/hidden          // Get hidden simulation IDs
GET /api/units/visible               // Get visible unit IDs
```

### Admin (Protected)

```javascript
GET  /api/admin/simulations          // Get all simulations
PUT  /api/admin/simulations/:id/toggle  // Toggle visibility
POST /api/admin/simulations/auto-discover  // Run auto-discovery
GET  /api/admin/units                // Get all units
PUT  /api/admin/units/:id/toggle     // Toggle unit visibility
```

---

## Best Practices

### ✅ DO

- Use descriptive component names (`FrameOfReferenceLab.vue`)
- Follow naming convention (`*Lab.vue` or `*Motion.vue`)
- Place files in correct category folders
- Add authentication to routes (`requiresAuth: true`)
- Test simulation before enabling in admin

### ❌ DON'T

- Don't use generic names (`Lab1.vue`, `Test.vue`)
- Don't skip the route registration
- Don't manually edit the database
- Don't forget to refresh admin dashboard after adding

---

## Troubleshooting

### Simulation Not Appearing in Admin

**Check:**
1. ✅ File has `Lab.vue` or `Motion.vue` suffix
2. ✅ File is in correct category folder
3. ✅ Admin dashboard has been refreshed
4. ✅ Check browser console for errors

**Fix:**
```bash
# Run manual sync
cd backend
node autoSyncSimulations.js
```

### Simulation Shows in Admin but Not Frontend

**Check:**
1. ✅ Simulation is marked as visible (eye icon green)
2. ✅ Route is registered in router
3. ✅ Parent unit is visible
4. ✅ Frontend has been refreshed

**Fix:**
- Toggle visibility off and on in admin dashboard
- Clear browser cache

### Auto-Discovery Not Working

**Check:**
1. ✅ Backend server is running
2. ✅ Admin is authenticated
3. ✅ File paths are correct

**Manual Alternative:**
Use the manual sync button in admin dashboard at `/simulations`

---

## Example: Adding "Circular Motion" Simulation

### Step 1: Create Component

File: `frontend/src/components/unit/kinematics/labs/CircularMotionLab.vue`

```vue
<script setup>
import { ref } from 'vue'

const radius = ref(5)
const velocity = ref(10)

const calculateCentripetal = () => {
  return (velocity.value ** 2) / radius.value
}
</script>

<template>
  <div class="circular-motion-lab">
    <h1>Circular Motion</h1>
    <div class="controls">
      <label>
        Radius: {{ radius }} m
        <input v-model.number="radius" type="range" min="1" max="10" />
      </label>
      <label>
        Velocity: {{ velocity }} m/s
        <input v-model.number="velocity" type="range" min="1" max="20" />
      </label>
    </div>
    <p>Centripetal Acceleration: {{ calculateCentripetal().toFixed(2) }} m/s²</p>
  </div>
</template>

<style scoped>
.circular-motion-lab {
  padding: 2rem;
}
</style>
```

### Step 2: Add Route

File: `frontend/src/router/index.js`

```javascript
{
  path: '/kinematics/circular-motion',
  name: 'CircularMotion',
  component: () => import('../components/unit/kinematics/labs/CircularMotionLab.vue'),
  meta: { requiresAuth: true }
}
```

### Step 3: Verify

1. Refresh admin dashboard → Navigate to `/simulations`
2. Look for "Circular Motion" under Kinematics category
3. It should be visible by default (green eye icon)
4. Visit frontend `/kinematics/circular-motion` to test

**Done! Your simulation is live.** 🎉

---

## Summary

The auto-discovery system makes adding simulations effortless:

1. **Create** a properly named Vue component
2. **Register** the route
3. **Refresh** admin dashboard

No manual database entries, no registry files, no configuration needed. The system handles everything automatically!

For questions or issues, check the troubleshooting section or review existing simulation components for reference.
