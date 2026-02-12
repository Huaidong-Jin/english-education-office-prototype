## Cursor Rules for Office Pantry Prototype

### 必读文档

Always follow `docs/PRD.md`, `docs/SCHEMA.md`, `docs/SAFETY_VALVE.md`.  
If conflicts, ask or choose the stricter rule.

### 工程约束

- No backend.  
- No external libraries.  
- Plain HTML/CSS/JS only.  
- Must run via local server and fetch JSON.  
- Must implement `selfTest` at startup and render errors in UI.

### 行为约束

- Do not change the JSON schema fields.  
- Do not “fake” navigation. Use `next` and `followupNode` exactly.  
- `SpeechSynthesis` must cancel before speaking. Provide replay and per-option preview.

### 验收约束

- Must demonstrate nonverbal consequences on awkward paths.  
- Every teasing beat must include exactly one graceful exit option and NPC must accept it.  
- Must implement recap: 3-panel replay + one alternative + one transfer question.

### 测试

Run manual smoke tests: Chrome and Safari audio unlock + navigation + recap.

