# ESC Study — Interactive Cardiology Guidelines

A local-first study app for converting ESC guideline flowcharts into interactive exam-style learning modules.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Add your Anthropic API key
Either:
- **Option A**: Create `.env.local` and add:
  ```
  ANTHROPIC_API_KEY=sk-ant-api03-...
  ```
- **Option B**: Launch the app and click **Settings** in the top nav to enter your key (stored in localStorage)

### 3. Run
```bash
npm run dev
```
Open http://localhost:3000

---

## Workflow

### Import a Diagram
1. Click **New Diagram** on the home screen
2. Upload a screenshot or PDF page of an ESC guideline flowchart
3. AI (Claude Sonnet) analyzes the image and extracts nodes, edges, and text
4. **Verify** the extraction on the editor screen — compare with the original image side-by-side
5. Edit any node labels, reposition nodes, configure which fields to hide
6. Click **Save & Continue**

### Study Mode
- See the diagram with hidden fields shown as text inputs
- Type answers and get **instant feedback** (toggle off for active recall)
- Reveal any field manually
- Track your running score

### Exam Mode 🔒
- All hidden fields shown as blank drop zones
- **Drag** answer chips from the bank OR **click** to type
- **Zero hints** during the exam
- Hit **Submit & Reveal** for full results at the end
- Retry incorrect answers only

---

## Hiding Configuration

In the editor, click any node → **Edit Node** → **Hide In Study/Exam**:

| Category | Use for |
|---|---|
| Medications | Drug names, dosages |
| Thresholds | Numerical cutoffs, scores |
| Branches | Decision branch labels |
| Full Node | Hide entire box content |

Or use **Hide Configuration** in the sidebar to bulk-apply categories.

---

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Library / home
│   ├── editor/[id]/          # Verification editor
│   ├── study/[id]/           # Study mode
│   ├── exam/[id]/            # Exam mode
│   └── api/extract/          # Anthropic API proxy
├── components/
│   ├── upload/UploadZone     # File upload + URL input
│   ├── flow/FlowCanvas       # React Flow wrapper
│   ├── flow/CustomNodes      # ESC-styled node types
│   ├── editor/DiagramEditor  # Full editor with sidebar
│   ├── exam/ExamMode         # Exam with dnd-kit drag/drop
│   └── settings/ApiKeyModal  # API key configuration
├── lib/
│   ├── types.ts              # All TypeScript types
│   ├── storage.ts            # localStorage persistence
│   ├── aiExtraction.ts       # AI prompt + API call
│   └── utils.ts              # dagre layout, helpers
```

## Tech Stack
- **Next.js 15** + **React 19** + **TypeScript**
- **@xyflow/react** (React Flow v12) — interactive diagrams
- **@dnd-kit** — drag & drop answer bank
- **dagre** — automatic graph layout
- **Zustand** — (available for state if needed)
- **Tailwind CSS** — medical dark theme
- **IBM Plex Sans/Mono** — typography

## Accuracy Notes

The AI extraction uses Claude's vision capabilities with a strict prompt designed to minimize hallucinations:
- Text is copied verbatim or marked `[unclear: ...]`
- No medical content is invented
- After extraction, the **verification editor** always shows the original image alongside the extracted diagram
- All AI output is manually editable before saving

Always verify extracted content against the original ESC guideline source.
