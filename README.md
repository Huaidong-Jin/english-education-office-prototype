# Office Pantry · Choice Talk

A visual novel / manga-style interactive dialogue game prototype. Practice natural workplace conversation through immersive scene-based choices.

## Features

- **Cinematic Visual Novel UI**: Full-screen scene illustrations with manga-style speech bubbles (吹き出し)
- **Interactive Dialogue**: Choose responses that affect NPC reactions and story flow
- **Text-to-Speech**: Browser-based TTS for immersive audio experience
- **Multilingual Support**: English primary with Chinese/Japanese subtitles
- **Quality Feedback**: Real-time feedback on conversation quality (natural/off/awkward)

## Tech Stack

- **Pure HTML/CSS/JavaScript** — No external frameworks
- **Browser TTS** — `window.speechSynthesis` for voice synthesis
- **JSON-driven scenes** — Scene data in `scenes/office_pantry_01.json`

## Quick Start

1. **Start a local server**:
   ```bash
   python3 -m http.server 8000
   ```

2. **Open in browser**:
   ```
   http://localhost:8000/office-prototype.html
   ```

3. **Enable Audio** (optional):
   - Click "Enable Audio" on the overlay
   - Adjust voice settings via the toolbar (♪ Voices)

## Project Structure

```
office-prototype/
├── office-prototype.html    # Main HTML entry point
├── app.js                   # Game logic & state machine
├── styles.css               # Visual novel UI styling
├── scenes/                  # Scene JSON data
│   └── office_pantry_01.json
├── assets/                  # Scene images & character portraits
│   ├── scene_pantry_afternoon.png
│   └── maya_portrait.png
└── docs/                    # Documentation
    ├── PRD.md              # Product requirements
    └── SCHEMA.md           # JSON schema reference
```

## Controls

- **Space** — Continue dialogue
- **1/2/3** — Choose option (when available)
- **R** — Replay last line
- **T** — Toggle subtitles (EN → EN+ZH → EN+JA)
- **V** — Voice settings panel

## Development

The game uses a node-based state machine:
- **NPC nodes** (`type: "npc"`) — Character dialogue
- **Pick nodes** (`type: "pick"`) — Player choice points
- **End nodes** (`type: "end"`) — Scene conclusion

See `docs/SCHEMA.md` for the full JSON schema.

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Safari
- ⚠️ Firefox (TTS support varies)

## License

MIT
