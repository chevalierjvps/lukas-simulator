# Scenario Builder Implementation - Remaining Work

## ✅ Completed So Far

1. **Event Log Moved to System Logs** ✓
   - Removed from monitor settings drawer
   - Added to ConfigPanel → System Logs tab with session selector
   
2. **Manual Step Trigger Controls** ✓
   - Added manual trigger buttons in scenario tab
   - Shows all timeline steps with active indicator
   - Click to jump to any step immediately

3. **Scenario Templates Created** ✓
   - File: `src/data/scenarioTemplates.js`
   - 6 pre-built templates:
     - Septic Shock
     - STEMI Progression
     - Hypertensive Crisis
     - Respiratory Failure
     - Post-Resuscitation Recovery
     - Anaphylaxis

---

## 🚧 Remaining Tasks

### 1. **Scenario Builder in Case Wizard**
**Location:** Add to ConfigPanel case wizard (between Demographics and Investigations)

**Required Components:**
- New wizard step: "Scenario Timeline"
- Timeline builder UI with drag-and-drop steps
- Add/Edit/Remove step buttons
- Preview functionality

### 2. **Step Editor Modal**
**Component:** Create `src/components/settings/ScenarioStepEditor.jsx`

**Features:**
- Form inputs for all vitals (HR, SpO2, BP, RR, Temp, EtCO2)
- ECG pattern selector
- Time input (minutes from start)
- Label/description field
- Rhythm selector
- ST elevation slider
- PVC/Wide QRS toggles

### 3. **Template Selector**
**Integration:** In scenario builder

**Features:**
- Dropdown showing all templates
- "Apply Template" button
- Preview template timeline
- Customize after applying

---

## Implementation Guide

### Step 1: Find Case Wizard in ConfigPanel

Search for: `editingCase` or case editing UI in ConfigPanel.jsx
The case wizard likely has steps like:
1. Basic Info
2. Demographics/Config
3. (NEW) Scenario Timeline
4. Investigations

### Step 2: Add Scenario Builder Step

```jsx
// In ConfigPanel case wizard
{wizardStep === 'scenario' && (
  <ScenarioBuilder
    scenario={editingCase.scenario || createEmptyScenario()}
    onChange={(newScenario) => setEditingCase({...editingCase, scenario: newScenario})}
  />
)}
```

### Step 3: Create ScenarioBuilder Component

**File:** `src/components/settings/ScenarioBuilder.jsx`

```jsx
import { getAllTemplates } from '../../data/scenarioTemplates';

export default function ScenarioBuilder({ scenario, onChange }) {
  const [timeline, setTimeline] = useState(scenario.timeline || []);
  const [editingStep, setEditingStep] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Timeline display with steps
  // Add step button
  // Template selector
  // Preview button
}
```

### Step 4: Create StepEditor Modal

**File:** `src/components/settings/ScenarioStepEditor.jsx`

```jsx
export default function ScenarioStepEditor({ step, onSave, onCancel }) {
  const [formData, setFormData] = useState(step || {
    time: 0,
    label: '',
    params: { hr: 80, spo2: 98, ... },
    conditions: { stElev: 0, ... },
    rhythm: 'NSR'
  });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      {/* Modal with form */}
    </div>
  );
}
```

### Step 5: Integrate Timeline Display

**Visual Design:**
```
┌──────────────────────────────────────┐
│ Scenario Timeline                     │
│ ☑ Enable  ☑ Auto-start              │
├──────────────────────────────────────┤
│ [From Template ▼] [+ Add Step]      │
├──────────────────────────────────────┤
│ ┌──────────────────────────────┐    │
│ │ ⏱ 0:00 - Initial             │    │
│ │ HR: 80  SpO2: 98%  BP: 120/80│    │
│ │ [Edit] [Delete] [▲] [▼]      │    │
│ └──────────────────────────────┘    │
│           ↓                           │
│ ┌──────────────────────────────┐    │
│ │ ⏱ 5:00 - MI develops         │    │
│ │ HR: 110  SpO2: 94%  ST: +2mm │    │
│ │ [Edit] [Delete] [▲] [▼]      │    │
│ └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

### Step 6: Add Preview Functionality

**Preview Modal:**
- Shows animated visualization of scenario
- Play through timeline at accelerated speed
- Display vitals changing
- Pause/resume/restart controls

---

## Code Snippets

### Empty Scenario Template
```javascript
const createEmptyScenario = () => ({
  enabled: true,
  autoStart: false,
  timeline: [{
    time: 0,
    label: "Initial state",
    params: { hr: 80, spo2: 98, rr: 16, bpSys: 120, bpDia: 80, temp: 37.0, etco2: 38 },
    conditions: { stElev: 0, pvc: false, wideQRS: false, tInv: false, noise: 0 },
    rhythm: "NSR"
  }]
});
```

### Apply Template Function
```javascript
const applyTemplate = (templateId) => {
  const template = getTemplateById(templateId);
  if (template) {
    setTimeline(template.timeline);
    onChange({ ...scenario, timeline: template.timeline });
  }
};
```

### Step Reordering
```javascript
const moveStep = (index, direction) => {
  const newTimeline = [...timeline];
  const newIndex = index + direction;
  if (newIndex >= 0 && newIndex < newTimeline.length) {
    [newTimeline[index], newTimeline[newIndex]] = [newTimeline[newIndex], newTimeline[index]];
    // Re-sort by time
    newTimeline.sort((a, b) => a.time - b.time);
    setTimeline(newTimeline);
  }
};
```

---

## Testing Checklist

Once implemented:
- [ ] Can create new scenario in case wizard
- [ ] Can add/edit/remove timeline steps
- [ ] Can apply templates
- [ ] Can customize templates after applying
- [ ] Can preview scenario
- [ ] Can save scenario with case
- [ ] Scenario loads correctly when case is selected
- [ ] Manual trigger controls work with custom scenarios
- [ ] Scenario auto-starts if configured
- [ ] Timeline interpolates correctly between steps

---

## UI/UX Considerations

### Visual Hierarchy
1. **Primary Actions:** Add Step, Apply Template
2. **Secondary Actions:** Edit, Delete, Reorder
3. **Tertiary Actions:** Preview, Enable/Disable

### Color Coding
- **Timeline Steps:** Blue border
- **Active Step:** Green highlight
- **Template-derived:** Purple badge
- **Custom Steps:** No badge

### Responsive Design
- Timeline scrollable if many steps
- Step cards stack on small screens
- Modal forms adapt to viewport

---

## Future Enhancements (Not Required Now)

- [ ] Branching scenarios (if/then logic)
- [ ] Trigger conditions (e.g., "if O2 given, go to step X")
- [ ] Import/export scenarios as separate files
- [ ] Scenario library/marketplace
- [ ] Collaborative editing
- [ ] Version history

---

## Status: 🟡 In Progress

**Completed:** 4/7 tasks (57%)
**Remaining:** 3 tasks
**Estimated Time:** 3-4 hours

**Next Steps:**
1. Locate case wizard in ConfigPanel.jsx
2. Add scenario step to wizard flow
3. Create ScenarioBuilder component
4. Create StepEditor modal
5. Add preview functionality
6. Test end-to-end workflow

---

**Last Updated:** January 10, 2026
