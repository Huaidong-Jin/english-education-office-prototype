/**
 * Office Pantry Prototype app logic.
 *
 * Plain HTML/CSS/JS, no external libraries.
 * Loads scene JSON via fetch and drives a node-type state machine.
 *
 * Data source: `scenes/office_pantry_01.json`
 */

/**
 * @typedef {"off"|"zh"|"ja"} SupportLang
 *
 * @typedef {{en: string, zh?: string, ja?: string}} LocalizedText
 * @typedef {{face?: string, gaze?: string, beat?: string}} Nonverbal
 *
 * @typedef {{
 *   followupNode: string,
 *   nonverbal?: Nonverbal
 * }} NpcReaction
 *
 * @typedef {{
 *   id: string,
 *   en: string,
 *   zh?: string,
 *   ja?: string,
 *   quality: "natural"|"off"|"awkward",
 *   intent: string,
 *   tone?: string[],
 *   isGracefulExit: boolean,
 *   npcReaction: NpcReaction,
 *   explain?: LocalizedText
 * }} Option
 *
 * @typedef {{
 *   id: string,
 *   type: "npc",
 *   speaker: string,
 *   line: LocalizedText,
 *   nonverbal?: Nonverbal,
 *   next: string
 * }} NpcNode
 *
 * @typedef {{
 *   id: string,
 *   type: "pick",
 *   prompt: LocalizedText,
 *   options: Option[],
 *   isTeasingBeat?: boolean,
 *   next?: null
 * }} PickNode
 *
 * @typedef {{
 *   id: string,
 *   type: "end",
 *   ending: string,
 *   line: LocalizedText
 * }} EndNode
 *
 * @typedef {NpcNode|PickNode|EndNode} Node
 *
 * @typedef {{
 *   id: string,
 *   title: LocalizedText,
 *   context?: {
 *     location?: string,
 *     time?: string,
 *     relationship?: string,
 *     vibe?: string[]
 *   },
 *   characters?: Record<string, any>
 * }} SceneMeta
 *
 * @typedef {{scene: SceneMeta, nodes: Node[]}} SceneFile
 */

(function () {
  "use strict";

  /** @param {string} id */
  const $ = (id) => document.getElementById(id);

  // DOM
  const audioOverlay = $("audioOverlay");
  const overlayEnable = $("overlayEnable");
  const overlayNoAudio = $("overlayNoAudio");
  const startupErrorsBox = $("startupErrors");

  const sceneTitleEl = $("sceneTitle");
  const sceneMetaEl = $("sceneMeta");
  const bgHintEl = $("bgHint");
  const dialogueBox = $("dialogueBox");
  const pickBox = $("pickBox");
  const feedbackBox = $("feedbackBox");
  const recapWrap = $("recapWrap");
  const stageEl = $("stage");

  const toggleSubsBtn = $("toggleSubsBtn");
  const toggleExplainBtn = $("toggleExplainBtn");
  const replayBtn = $("replayBtn");
  const voiceBtn = $("voiceBtn");
  const restartBtn = $("restartBtn");

  const langChip = $("langChip");
  const audioChip = $("audioChip");

  const voicePanel = $("voicePanel");
  const npcVoiceSelect = $("npcVoiceSelect");
  const playerVoiceSelect = $("playerVoiceSelect");
  const rateRange = $("rateRange");
  const pitchRange = $("pitchRange");
  const rateLabel = $("rateLabel");
  const pitchLabel = $("pitchLabel");

  const nodeIdLabel = $("nodeIdLabel");
  const pickCountLabel = $("pickCountLabel");
  const lastQualityLabel = $("lastQualityLabel");

  /** @type {SceneFile | null} */
  let scene = null;

  /** @type {Map<string, Node>} */
  let nodeMap = new Map();

  const state = {
    audioEnabled: false,
    showExplain: false,
    /** @type {SupportLang} */
    supportLang: "off",
    /** @type {SpeechSynthesisVoice[]} */
    voices: [],
    voiceReady: false,
    /** @type {string | null} */
    currentNodeId: null,
    /** @type {string | null} */
    lastNpcSpeakerId: null,
    /** @type {{ who: "npc" | "player", text: string } | null} */
    lastSpoken: null,
    /** @type {Array<{
     *   pickNodeId: string,
     *   promptEn: string,
     *   chosenEn: string,
     *   chosenQuality: string,
     *   naturalEn: string,
     *   chosenIsExit: boolean
     * }>} */
    picks: [],
    lastQuality: "-",
    ended: false,
  };

  let speechToken = 0;

  /**
   * @param {string | undefined} ending
   * @param {"natural"|"off"|"awkward"|null} qualityHint
   */
  function stageMoodFrom(ending, qualityHint) {
    if (ending === "cold") return "cold";
    if (ending === "soft") return "warm";
    if (qualityHint === "awkward") return "awkward";
    if (qualityHint === "off") return "off";
    if (qualityHint === "natural") return "warm";
    return "";
  }

  /** @param {string} mood */
  function setStageMood(mood) {
    if (!stageEl) return;
    stageEl.dataset.mood = mood || "";
    // Also tint the scene hero image
    if (bgHintEl) bgHintEl.dataset.mood = mood || "";
  }

  /** @returns {Promise<SceneFile>} */
  async function loadSceneFile() {
    const res = await fetch("scenes/office_pantry_01.json", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to load scene JSON: ${res.status} ${res.statusText}`);
    }
    /** @type {unknown} */
    const data = await res.json();
    return /** @type {SceneFile} */ (data);
  }

  /** @param {Node[]} nodes */
  function buildNodeMap(nodes) {
    nodeMap = new Map(nodes.map((n) => [n.id, n]));
  }

  /** @param {string[]} errors */
  function renderStartupErrors(errors) {
    startupErrorsBox.textContent = errors.join("\n");
    startupErrorsBox.classList.add("show");
  }

  /** @param {string} message */
  function renderStartupErrorMessage(message) {
    renderStartupErrors([message]);
  }

  function setChips() {
    langChip.textContent =
      state.supportLang === "off" ? "EN" : `EN+${state.supportLang.toUpperCase()}`;
    audioChip.textContent = state.audioEnabled ? "Audio: on" : "Audio: off";
  }

  /** @param {LocalizedText | undefined | null} obj */
  function getTextBlock(obj) {
    const out = { en: obj?.en || "" };
    if (obj?.zh) out.zh = obj.zh;
    if (obj?.ja) out.ja = obj.ja;
    return out;
  }

  /** @param {LocalizedText | undefined | null} block */
  function textByLang(block) {
    if (!block) return "";
    if (state.supportLang === "zh") return block.zh || "";
    if (state.supportLang === "ja") return block.ja || "";
    return "";
  }

  function safeCancelSpeech() {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {
      // ignore
    }
  }

  /** @param {string} name */
  function getVoiceByName(name) {
    if (!name) return null;
    return state.voices.find((v) => v.name === name) || null;
  }

  function defaultEnglishVoices() {
    const en = state.voices.filter((v) =>
      (v.lang || "").toLowerCase().startsWith("en")
    );
    return en.length ? en : state.voices;
  }

  function populateVoiceSelects() {
    const enVoices = defaultEnglishVoices();

    npcVoiceSelect.innerHTML = "";
    playerVoiceSelect.innerHTML = "";

    for (const v of enVoices) {
      const opt1 = document.createElement("option");
      opt1.value = v.name;
      opt1.textContent = `${v.name} (${v.lang})`;
      npcVoiceSelect.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = v.name;
      opt2.textContent = `${v.name} (${v.lang})`;
      playerVoiceSelect.appendChild(opt2);
    }

    // Best-effort defaults, prefer common natural voices when present.
    const preferNpc = [
      "Samantha",
      "Victoria",
      "Karen",
      "Moira",
      "Daniel",
      "Serena",
      "Google US English",
    ];
    const preferPlayer = [
      "Alex",
      "Daniel",
      "Aaron",
      "Fred",
      "Tom",
      "Google UK English Male",
      "Google US English",
    ];

    /** @param {string[]} prefs @param {HTMLSelectElement} selectEl */
    const pickPreferred = (prefs, selectEl) => {
      const names = enVoices.map((v) => v.name);
      for (const p of prefs) {
        const idx = names.findIndex((n) =>
          n.toLowerCase().includes(p.toLowerCase())
        );
        if (idx >= 0) {
          selectEl.selectedIndex = idx;
          return;
        }
      }
      selectEl.selectedIndex = 0;
    };

    pickPreferred(preferNpc, npcVoiceSelect);
    pickPreferred(preferPlayer, playerVoiceSelect);
  }

  /** @param {string} text @param {"npc"|"player"} who */
  /**
   * Speak text via TTS. Optional callback fires when speech finishes.
   * @param {string} text
   * @param {"npc"|"player"} who
   * @param {(() => void) | undefined} [onDone]
   */
  function speak(text, who, onDone) {
    state.lastSpoken = { who, text };

    if (!state.audioEnabled) {
      // No audio: fire callback after a reading delay
      if (onDone) {
        const delay = Math.max(1500, text.length * 35);
        setTimeout(onDone, delay);
      }
      return;
    }

    // Cancel only if something is actively speaking (avoids Chrome freeze bug).
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      safeCancelSpeech();
    }

    const token = ++speechToken;
    const utter = new SpeechSynthesisUtterance(text);

    const voiceName = who === "npc" ? npcVoiceSelect.value : playerVoiceSelect.value;
    const v = getVoiceByName(voiceName);
    if (v) utter.voice = v;

    utter.rate = Number(rateRange.value || 1.0);
    utter.pitch = Number(pitchRange.value || 1.0);

    utter.onend = () => {
      if (token !== speechToken) return;
      if (onDone) onDone();
    };

    // Chrome safety: small delay after cancel to let engine reset.
    setTimeout(() => {
      window.speechSynthesis.speak(utter);
    }, 50);
  }

  /**
   * Map `nonverbal` into a portrait state.
   * @param {Nonverbal | undefined} nonverbal
   * @param {"natural"|"off"|"awkward"|null} qualityHint
   */
  function portraitStateFrom(nonverbal, qualityHint) {
    const face = (nonverbal?.face || "").toLowerCase();
    const gaze = (nonverbal?.gaze || "").toLowerCase();
    const beat = (nonverbal?.beat || "").toLowerCase();

    /** @type {"smile"|"smirk"|"flat"|"frown"|"awkward"} */
    let exp = "flat";
    if (face.includes("laugh") || face.includes("smile")) exp = "smile";
    else if (face.includes("smirk") || face.includes("tease")) exp = "smirk";
    else if (face.includes("hurt")) exp = "frown";
    else if (face.includes("awkward")) exp = "awkward";
    else if (face.includes("pause") || face.includes("freeze")) exp = "flat";
    else if (qualityHint === "awkward") exp = "awkward";

    /** @type {"direct"|"side"|"avoid"|"down"} */
    let g = "direct";
    if (gaze.includes("avoid")) g = "avoid";
    else if (gaze.includes("side")) g = "side";
    else if (gaze.includes("down")) g = "down";

    /** @type {"quick"|"release"|"cool"|""} */
    let b = "";
    if (beat.includes("quick")) b = "quick";
    else if (beat.includes("release")) b = "release";
    else if (beat.includes("cool")) b = "cool";

    return { exp, gaze: g, beat: b };
  }

  /**
   * Create an image-based portrait with CSS expression/gaze/beat classes.
   * @param {string} speakerId
   * @param {Nonverbal | undefined} nonverbal
   * @param {"natural"|"off"|"awkward"|null} qualityHint
   */
  function createPortrait(speakerId, nonverbal, qualityHint) {
    const st = portraitStateFrom(nonverbal, qualityHint);

    const wrap = document.createElement("div");
    wrap.className = "portrait";
    wrap.classList.add(`exp-${st.exp}`);
    wrap.classList.add(`gaze-${st.gaze}`);
    if (st.beat) wrap.classList.add(`beat-${st.beat}`);
    wrap.setAttribute("aria-label", `${getSpeakerDisplayName(speakerId)} portrait`);

    const img = document.createElement("img");
    img.src = "assets/maya_portrait.png";
    img.alt = getSpeakerDisplayName(speakerId);
    img.draggable = false;

    wrap.appendChild(img);
    return wrap;
  }

  /**
   * Create small manga marks (emanata) for awkwardness / warmth.
   * @param {Nonverbal | undefined} nonverbal
   * @param {string} mood
   */
  function createEmanata(nonverbal, mood) {
    const face = (nonverbal?.face || "").toLowerCase();
    const beat = (nonverbal?.beat || "").toLowerCase();
    const gaze = (nonverbal?.gaze || "").toLowerCase();

    const marks = [];
    if (mood === "awkward" || face.includes("pause") || beat.includes("awkward")) marks.push({ t: "...", k: "bad" });
    if (mood === "off") marks.push({ t: "?", k: "warn" });
    if (mood === "warm" && (face.includes("laugh") || face.includes("smile") || face.includes("tease"))) marks.push({ t: "✦", k: "ok" });
    if (gaze.includes("avoid") || face.includes("awkward")) marks.push({ t: "汗", k: "warn" });

    if (!marks.length) return null;

    const box = document.createElement("div");
    box.className = "emanata";
    for (const m of marks.slice(0, 3)) {
      const s = document.createElement("span");
      s.className = "mark " + m.k;
      s.textContent = m.t;
      box.appendChild(s);
    }
    return box;
  }

  /**
   * @param {Nonverbal | undefined} nonverbal
   * @param {"natural"|"off"|"awkward"|null} qualityHint
   */
  function makeCueChips(nonverbal, qualityHint) {
    const cues = [];
    if (!nonverbal) return cues;

    const face = nonverbal.face ? `face:${nonverbal.face}` : "";
    const gaze = nonverbal.gaze ? `gaze:${nonverbal.gaze}` : "";
    const beat = nonverbal.beat ? `beat:${nonverbal.beat}` : "";

    for (const c of [face, gaze, beat]) {
      if (c) cues.push(c);
    }

    if (qualityHint) cues.push(`impact:${qualityHint}`);
    return cues;
  }

  /** @param {string} speakerId */
  function getSpeakerDisplayName(speakerId) {
    const chars = scene?.scene?.characters;
    if (!chars) return speakerId || "NPC";

    for (const v of Object.values(chars)) {
      if (v && typeof v === "object" && v.id === speakerId && v.displayName) {
        return String(v.displayName);
      }
    }
    return speakerId || "NPC";
  }

  /** @param {string} speakerId */
  function getSpeakerAvatarLetter(speakerId) {
    const name = getSpeakerDisplayName(speakerId);
    return (name || "N").slice(0, 1).toUpperCase();
  }

  /** @param {NpcNode} node @param {"natural"|"off"|"awkward"|null} qualityHint */
  function renderNpcNode(node, qualityHint) {
    state.ended = false;
    pickBox.style.display = "none";
    dialogueBox.style.opacity = "1";
    dialogueBox.style.pointerEvents = "auto";
    feedbackBox.classList.remove("show");
    recapWrap.classList.remove("show");
    recapWrap.innerHTML = "";

    nodeIdLabel.textContent = node.id;
    state.lastNpcSpeakerId = node.speaker;

    const speakerName = getSpeakerDisplayName(node.speaker);
    const line = getTextBlock(node.line);
    const sub = textByLang(line);

    const mood = stageMoodFrom(undefined, qualityHint);
    setStageMood(mood);

    const avatar = createPortrait(node.speaker, node.nonverbal, qualityHint);

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    if (mood) bubble.classList.add(`mood-${mood}`);

    const nameEl = document.createElement("div");
    nameEl.className = "speaker-name";
    nameEl.textContent = speakerName;

    const p = document.createElement("p");
    p.className = "line-text";
    p.textContent = line.en;

    const subEl = document.createElement("div");
    subEl.className = "sub-text" + (state.supportLang !== "off" ? " show" : "");
    subEl.textContent = sub;

    bubble.appendChild(nameEl);
    bubble.appendChild(p);
    bubble.appendChild(subEl);

    const em = createEmanata(node.nonverbal, mood);
    if (em) bubble.appendChild(em);

    // Cue chips: only visible when Explain mode is on
    if (state.showExplain) {
      const cues = makeCueChips(node.nonverbal, qualityHint);
      if (cues.length) {
        const cueRow = document.createElement("div");
        cueRow.className = "cueRow";
        for (const c of cues) {
          const span = document.createElement("span");
          let cls = "cue";
          if (qualityHint === "awkward") cls += " bad";
          else if (qualityHint === "off") cls += " warn";
          else if (qualityHint === "natural") cls += " ok";
          span.className = cls;
          span.textContent = c;
          cueRow.appendChild(span);
        }
        bubble.appendChild(cueRow);
      }
    }

    dialogueBox.innerHTML = "";
    const dlg = document.createElement("div");
    dlg.className = "dialogue";
    dlg.appendChild(avatar);
    dlg.appendChild(bubble);
    dialogueBox.appendChild(dlg);

    // Check if next node is a pick — if so, auto-advance after speech
    const nextNode = node.next ? nodeMap.get(node.next) : null;
    const nextIsPick = nextNode && nextNode.type === "pick";

    if (nextIsPick) {
      // Auto-advance: options appear after Maya finishes speaking
      speak(line.en, "npc", () => goNextFromNpc(node));
    } else {
      // Show Continue button for non-pick transitions
      const btn = document.createElement("button");
      btn.className = "continue-btn";
      btn.textContent = "Continue \u25B8";
      btn.title = "Space";
      btn.addEventListener("click", () => goNextFromNpc(node));
      bubble.appendChild(btn);
      speak(line.en, "npc");
    }
  }

  /**
   * Replace the current portrait to reflect consequence (eyes/face/beat).
   * @param {Nonverbal | undefined} nonverbal
   * @param {"natural"|"off"|"awkward"|null} qualityHint
   */
  function updatePortrait(nonverbal, qualityHint) {
    const dlg = dialogueBox.querySelector(".dialogue");
    if (!dlg) return;
    const old = dlg.querySelector(".portrait, .avatar");
    if (!old) return;

    const speakerId = state.lastNpcSpeakerId || "npc";
    const next = createPortrait(speakerId, nonverbal, qualityHint);
    old.replaceWith(next);
  }

  /** @param {PickNode} node */
  function renderPickNode(node) {
    state.ended = false;
    nodeIdLabel.textContent = node.id;

    // Hide Maya's bubble, show picks overlay
    dialogueBox.style.opacity = "0";
    dialogueBox.style.pointerEvents = "none";
    pickBox.style.display = "block";
    feedbackBox.classList.remove("show");
    feedbackBox.innerHTML = "";
    recapWrap.classList.remove("show");
    recapWrap.innerHTML = "";

    const prompt = getTextBlock(node.prompt);
    const promptSub = textByLang(prompt);

    pickBox.innerHTML = "";

    const promptEl = document.createElement("div");
    promptEl.className = "pick-prompt";
    promptEl.textContent = prompt.en;

    const promptSubEl = document.createElement("div");
    promptSubEl.className = "pick-prompt-sub" + (state.supportLang !== "off" ? " show" : "");
    promptSubEl.textContent = promptSub;

    const optionsEl = document.createElement("div");
    optionsEl.className = "options";

    pickBox.appendChild(promptEl);
    pickBox.appendChild(promptSubEl);
    pickBox.appendChild(optionsEl);

    node.options.forEach((o, idx) => {
      const opt = document.createElement("div");
      opt.className = "opt";
      const q =
        o.quality === "natural" ? "natural" : o.quality === "awkward" ? "awkward" : "off";
      opt.classList.add(`q-${q}`);

      const ix = document.createElement("div");
      ix.className = "idx";
      ix.textContent = String(idx + 1);

      const main = document.createElement("div");
      main.className = "main";

      const en = document.createElement("div");
      en.className = "en";
      en.textContent = o.en;

      const subs = document.createElement("div");
      subs.className = "subs" + (state.supportLang !== "off" ? " show" : "");
      subs.textContent =
        state.supportLang === "zh"
          ? o.zh || ""
          : state.supportLang === "ja"
            ? o.ja || ""
            : "";

      // Tags hidden by default; visible when Explain mode is on
      const tags = document.createElement("div");
      tags.className = "tags" + (state.showExplain ? " show" : "");
      tags.appendChild(makeTag(`intent:${o.intent}`, true));
      for (const t of o.tone || []) tags.appendChild(makeTag(t));
      if (o.isGracefulExit) tags.appendChild(makeTag("graceful-exit"));

      main.appendChild(en);
      main.appendChild(subs);
      main.appendChild(tags);

      // Arrow indicator
      const arrow = document.createElement("span");
      arrow.className = "opt-arrow";
      arrow.textContent = "\u25B8";

      opt.appendChild(ix);
      opt.appendChild(main);
      opt.appendChild(arrow);

      // Entire card is clickable to choose
      opt.addEventListener("click", () => chooseOption(node, o));

      // Staggered entrance animation
      opt.style.opacity = "0";
      opt.style.transform = "translateY(10px)";
      setTimeout(() => {
        opt.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        opt.style.opacity = "1";
        opt.style.transform = "translateY(0)";
      }, 80 * idx);

      optionsEl.appendChild(opt);
    });
  }

  /** @param {EndNode} node */
  function renderEndNode(node) {
    state.ended = true;
    nodeIdLabel.textContent = node.id;

    pickBox.style.display = "none";
    feedbackBox.classList.remove("show");

    const line = getTextBlock(node.line);
    const sub = textByLang(line);

    const mood = stageMoodFrom(node.ending, null);
    setStageMood(mood);

    const avatar = createPortrait("maya", undefined, node.ending === "cold" ? "awkward" : "natural");

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    if (mood) bubble.classList.add(`mood-${mood}`);

    const nameEl = document.createElement("div");
    nameEl.className = "speaker-name";
    nameEl.textContent = node.ending === "cold" ? "ENDING \u00B7 COLD" : "ENDING \u00B7 WARM";

    const p = document.createElement("p");
    p.className = "line-text";
    p.textContent = line.en;

    const subEl = document.createElement("div");
    subEl.className = "sub-text" + (state.supportLang !== "off" ? " show" : "");
    subEl.textContent = sub;

    const btn = document.createElement("button");
    btn.className = "continue-btn";
    btn.textContent = "Show Recap \u25B8";
    btn.addEventListener("click", () => showRecap());

    bubble.appendChild(nameEl);
    bubble.appendChild(p);
    bubble.appendChild(subEl);
    bubble.appendChild(btn);

    dialogueBox.innerHTML = "";
    const dlg = document.createElement("div");
    dlg.className = "dialogue";
    dlg.appendChild(avatar);
    dlg.appendChild(bubble);
    dialogueBox.appendChild(dlg);

    speak(line.en, "npc");
    showRecap();
  }

  /** @param {Option} option @param {Nonverbal | undefined} reactionNonverbal */
  function showFeedback(option, reactionNonverbal) {
    const q =
      option.quality === "natural"
        ? "natural"
        : option.quality === "awkward"
          ? "awkward"
          : "off";

    state.lastQuality = q;
    lastQualityLabel.textContent = q;
    setStageMood(stageMoodFrom(undefined, /** @type {any} */ (q)));

    const explain = getTextBlock(option.explain);
    const explainSub = textByLang(explain);

    // Stage direction from nonverbal cues
    const dirParts = [];
    if (reactionNonverbal?.face) dirParts.push(reactionNonverbal.face);
    if (reactionNonverbal?.gaze) dirParts.push("gaze: " + reactionNonverbal.gaze);
    if (reactionNonverbal?.beat) dirParts.push(reactionNonverbal.beat);
    const stageDirection = dirParts.length ? "(" + dirParts.join(" \u00B7 ") + ")" : "";

    feedbackBox.innerHTML = "";

    const hdr = document.createElement("div");
    hdr.className = "fb-header";

    const badge = document.createElement("span");
    badge.className = "quality-badge " + q;
    badge.textContent = q.toUpperCase();

    const nextBtn = document.createElement("button");
    nextBtn.className = "fb-next-btn";
    nextBtn.textContent = "Next \u25B8";
    nextBtn.addEventListener("click", () => {
      setCurrent(option.npcReaction.followupNode, q);
    });

    hdr.appendChild(badge);
    hdr.appendChild(nextBtn);
    feedbackBox.appendChild(hdr);

    if (stageDirection) {
      const dir = document.createElement("div");
      dir.className = "fb-stage-dir";
      dir.textContent = stageDirection;
      feedbackBox.appendChild(dir);
    }

    const exp = document.createElement("div");
    exp.className = "explain" + (state.showExplain ? " show" : "");
    exp.textContent = explain.en;

    const expSub = document.createElement("div");
    expSub.className = "subText" + (state.supportLang !== "off" ? " show" : "");
    expSub.textContent = explainSub;

    feedbackBox.appendChild(exp);
    feedbackBox.appendChild(expSub);
    feedbackBox.classList.add("show");
  }

  /** @param {PickNode} pickNode @param {Option} option */
  function chooseOption(pickNode, option) {
    // Hide picks overlay, restore dialogue bubble
    pickBox.style.display = "none";
    dialogueBox.style.opacity = "1";
    dialogueBox.style.pointerEvents = "auto";
    
    speak(option.en, "player");

    const natural =
      pickNode.options.find((o) => o.quality === "natural" && o.intent !== "exit") ||
      pickNode.options.find((o) => o.quality === "natural") ||
      pickNode.options[0];

    state.picks.push({
      pickNodeId: pickNode.id,
      promptEn: pickNode.prompt.en,
      chosenEn: option.en,
      chosenQuality: option.quality,
      naturalEn: natural ? natural.en : "",
      chosenIsExit: option.isGracefulExit === true,
    });

    pickCountLabel.textContent = String(state.picks.length);

    const reactionNonverbal =
      option.npcReaction?.nonverbal || { face: "neutral", gaze: "neutral", beat: "neutral" };

    showFeedback(option, reactionNonverbal);

    const reactionLine = buildReactionLine(
      reactionNonverbal,
      option.quality,
      option.isGracefulExit
    );
    injectReactionIntoDialogue(reactionLine, reactionNonverbal, option.quality);

    const q =
      option.quality === "natural"
        ? "natural"
        : option.quality === "awkward"
          ? "awkward"
          : "off";
    updatePortrait(reactionNonverbal, q);
  }

  /** @param {Nonverbal | undefined} nonverbal @param {string} quality @param {boolean} isExit */
  function buildReactionLine(nonverbal, quality, isExit) {
    const face = nonverbal?.face || "neutral";
    const beat = nonverbal?.beat || "neutral";

    if (isExit) return "Maya receives it warmly and gives you space.";
    if (quality === "awkward") {
      return `There is a noticeable pause. Maya’s ${face} shows it. (${beat})`;
    }
    if (quality === "off") return "Maya keeps it going, but the vibe dips slightly.";
    return "Maya reacts smoothly and stays playful.";
  }

  /** @param {string} line @param {Nonverbal | undefined} nonverbal @param {string} quality */
  function injectReactionIntoDialogue(line, nonverbal, quality) {
    const bubble = dialogueBox.querySelector(".bubble");
    if (!bubble) return;

    // Remove any previously injected reaction
    const prev = bubble.querySelector(".stage-dir.injected");
    if (prev) prev.remove();

    const stageDir = document.createElement("div");
    stageDir.className = "stage-dir injected";
    stageDir.textContent = line;
    bubble.appendChild(stageDir);
  }

  /** @param {NpcNode} node */
  function goNextFromNpc(node) {
    if (!node.next) return;
    setCurrent(node.next, null);
  }

  /** @param {string} nodeId @param {"natural"|"off"|"awkward"|null} qualityHint */
  function setCurrent(nodeId, qualityHint) {
    const node = nodeMap.get(nodeId);
    state.currentNodeId = nodeId;
    nodeIdLabel.textContent = nodeId;

    if (!node) return;

    if (node.type === "npc") {
      renderNpcNode(/** @type {NpcNode} */ (node), qualityHint);
      pickBox.style.display = "none";
    } else if (node.type === "pick") {
      renderPickNode(/** @type {PickNode} */ (node));
    } else if (node.type === "end") {
      renderEndNode(/** @type {EndNode} */ (node));
    }
  }

  function showRecap() {
    recapWrap.innerHTML = "";
    recapWrap.classList.add("show");

    const title = document.createElement("div");
    title.className = "recap-title";
    title.textContent = "Scene Recap";

    const last3 = state.picks.slice(-3);
    const grid = document.createElement("div");
    grid.className = "recapGrid";

    last3.forEach((p, i) => {
      const c = document.createElement("div");
      c.className = "panelCard";

      const ttl = document.createElement("div");
      ttl.className = "ttl";
      ttl.textContent = `Panel ${i + 1}`;

      const badge = document.createElement("span");
      badge.className = "panelBadge";
      const q =
        p.chosenQuality === "natural"
          ? "ok"
          : p.chosenQuality === "awkward"
            ? "bad"
            : "warn";
      badge.classList.add(q);
      badge.textContent = (p.chosenQuality || "off").toUpperCase();
      ttl.appendChild(badge);

      const txt = document.createElement("div");
      txt.className = "txt";
      txt.textContent = p.chosenEn;

      c.appendChild(ttl);
      c.appendChild(txt);
      grid.appendChild(c);
    });

    const alt = document.createElement("div");
    alt.className = "panelCard";
    const altT = document.createElement("div");
    altT.className = "ttl";
    altT.textContent = "Better alternative";
    const altPick = findWorstPickForAlternative();
    const altTxt = document.createElement("div");
    altTxt.className = "txt";
    altTxt.textContent = altPick
      ? altPick.naturalEn
      : "Try a softer, playful line that keeps it light.";
    alt.appendChild(altT);
    alt.appendChild(altTxt);

    const transfer = document.createElement("div");
    transfer.className = "panelCard transfer";
    const tt = document.createElement("div");
    tt.className = "ttl";
    tt.textContent = "Transfer question";
    const q = document.createElement("div");
    q.className = "txt";
    q.style.marginBottom = "12px";
    q.textContent = "Elevator, barely-known coworker: what\u2019s the best line to keep it light?";
    transfer.appendChild(tt);
    transfer.appendChild(q);

    const choices = [
      { id: "a", en: "Long time no see. We should totally hang out this weekend.", quality: "awkward" },
      { id: "b", en: "Hey. How’s it going? Busy day?", quality: "natural" },
      { id: "c", en: "I am proceeding efficiently according to plan.", quality: "awkward" },
    ];

    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "8px";

    choices.forEach((c, idx) => {
      const b = document.createElement("button");
      b.textContent = `${idx + 1}. ${c.en}`;
      b.addEventListener("click", () => {
        const ok = c.quality === "natural";
        b.textContent = ok ? `✅ ${idx + 1}. ${c.en}` : `❌ ${idx + 1}. ${c.en}`;
        speak(c.en, "player");
      });
      list.appendChild(b);
    });

    transfer.appendChild(list);

    const actions = document.createElement("div");
    actions.className = "recap-actions";

    const replayPanels = document.createElement("button");
    replayPanels.textContent = "Replay last line";
    replayPanels.addEventListener("click", () => replayLast());

    const restart = document.createElement("button");
    restart.className = "primary-action";
    restart.textContent = "Restart scene";
    restart.addEventListener("click", () => start());

    actions.appendChild(replayPanels);
    actions.appendChild(restart);

    recapWrap.appendChild(title);
    if (last3.length) recapWrap.appendChild(grid);
    recapWrap.appendChild(alt);
    recapWrap.appendChild(transfer);
    recapWrap.appendChild(actions);
  }

  function findWorstPickForAlternative() {
    const awkward = [...state.picks].reverse().find((p) => p.chosenQuality === "awkward");
    return awkward || state.picks[state.picks.length - 1] || null;
  }

  /** @param {string} text */
  function makeTag(text, isSfx = false) {
    const t = document.createElement("span");
    t.className = "tag" + (isSfx ? " sfx" : "");
    t.textContent = text;
    return t;
  }

  function replayLast() {
    if (!state.lastSpoken) return;
    speak(state.lastSpoken.text, state.lastSpoken.who);
  }

  /** @param {string | undefined | null} s */
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c] || c));
  }

  function toggleSubs() {
    if (state.supportLang === "off") state.supportLang = "zh";
    else if (state.supportLang === "zh") state.supportLang = "ja";
    else state.supportLang = "off";

    setChips();
    if (state.currentNodeId) setCurrent(state.currentNodeId, null);
  }

  function toggleExplain() {
    state.showExplain = !state.showExplain;
    const explains = document.querySelectorAll(".explain");
    explains.forEach((el) => {
      if (state.showExplain) el.classList.add("show");
      else el.classList.remove("show");
    });
    // Also toggle tag visibility on option cards
    const tags = document.querySelectorAll(".tags");
    tags.forEach((el) => {
      if (state.showExplain) el.classList.add("show");
      else el.classList.remove("show");
    });
    // Re-render current node to update cue chip visibility
    if (state.currentNodeId) {
      const node = nodeMap.get(state.currentNodeId);
      if (node && node.type === "npc") {
        renderNpcNode(/** @type {NpcNode} */ (node), /** @type {any} */ (state.lastQuality === "-" ? null : state.lastQuality));
      }
    }
  }

  function toggleVoicePanel() {
    voicePanel.style.display = voicePanel.style.display === "none" ? "block" : "none";
  }

  function updateRatePitchLabels() {
    rateLabel.textContent = Number(rateRange.value).toFixed(2);
    pitchLabel.textContent = Number(pitchRange.value).toFixed(2);
  }

  function initVoices() {
    const load = () => {
      state.voices = window.speechSynthesis.getVoices() || [];
      state.voiceReady = state.voices.length > 0;
      if (state.voiceReady) populateVoiceSelects();
    };
    load();
    window.speechSynthesis.onvoiceschanged = () => load();

    // Chrome workaround: TTS pauses on long utterances; periodic resume() fixes it.
    setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 5000);
  }

  function enableAudio() {
    state.audioEnabled = true;
    setChips();
    audioOverlay.classList.add("hidden");

    // Warm-up: speak a short silent utterance to unlock browser audio.
    // Do NOT cancel immediately — Chrome's TTS engine freezes on rapid cancel().
    try {
      const warmup = new SpeechSynthesisUtterance(" ");
      warmup.volume = 0;
      warmup.onend = () => {
        // Now speak the current NPC line
        const node = state.currentNodeId ? nodeMap.get(state.currentNodeId) : null;
        if (node && node.type === "npc") {
          speak(/** @type {NpcNode} */ (node).line.en, "npc");
        }
      };
      window.speechSynthesis.speak(warmup);
    } catch (_) {
      // Fallback: try speaking directly
      const node = state.currentNodeId ? nodeMap.get(state.currentNodeId) : null;
      if (node && node.type === "npc") {
        speak(/** @type {NpcNode} */ (node).line.en, "npc");
      }
    }
  }

  function disableAudio() {
    state.audioEnabled = false;
    setChips();
    audioOverlay.classList.add("hidden");
    safeCancelSpeech();
  }

  function fillSceneHeader() {
    if (!scene) return;

    const t = scene.scene.title;
    sceneTitleEl.textContent = t.en;

    sceneMetaEl.innerHTML = "";
    const ctx = scene.scene.context || {};
    const vibes = Array.isArray(ctx.vibe) ? ctx.vibe : [];

    const pills = [
      ctx.location,
      ctx.time,
      ctx.relationship,
      ...vibes,
    ].filter(Boolean);

    for (const c of /** @type {string[]} */ (pills)) {
      const s = document.createElement("span");
      s.className = "chip";
      s.textContent = c;
      sceneMetaEl.appendChild(s);
    }

    // Scene hero: establishing shot + gradient overlay + floating context pills.
    bgHintEl.innerHTML = "";

    const img = document.createElement("img");
    img.className = "scene-hero__img";
    img.src = "assets/scene_pantry_afternoon.png";
    img.alt = t.en;
    img.draggable = false;

    const overlay = document.createElement("div");
    overlay.className = "scene-hero__overlay";

    const pillsWrap = document.createElement("div");
    pillsWrap.className = "scene-hero__pills";

    const label = document.createElement("span");
    label.className = "scene-hero__label";
    label.textContent = "SCENE";
    pillsWrap.appendChild(label);

    /** @param {string} text */
    const makePill = (text) => {
      const p = document.createElement("span");
      p.className = "scene-hero__pill";
      p.textContent = text;
      return p;
    };

    if (ctx.location) pillsWrap.appendChild(makePill(ctx.location));
    if (ctx.time) pillsWrap.appendChild(makePill(ctx.time));
    if (ctx.relationship) pillsWrap.appendChild(makePill(ctx.relationship));
    for (const v of vibes.slice(0, 4)) pillsWrap.appendChild(makePill(v));

    bgHintEl.appendChild(img);
    bgHintEl.appendChild(overlay);
    bgHintEl.appendChild(pillsWrap);
  }

  function start() {
    state.picks = [];
    state.lastQuality = "-";
    state.ended = false;
    pickCountLabel.textContent = "0";
    lastQualityLabel.textContent = "-";
    safeCancelSpeech();

    fillSceneHeader();
    setChips();

    if (!nodeMap.has("n001")) {
      renderStartupErrorMessage('Missing start node "n001".');
      return;
    }
    setCurrent("n001", null);
  }

  /** @param {KeyboardEvent} e */
  function handleKey(e) {
    const k = e.key.toLowerCase();

    if (k === "t") toggleSubs();
    if (k === "v") toggleVoicePanel();
    if (k === "r") replayLast();

    if (k === " " || e.code === "Space") {
      e.preventDefault();
      const node = state.currentNodeId ? nodeMap.get(state.currentNodeId) : null;
      if (!node) return;
      if (node.type === "npc") goNextFromNpc(/** @type {NpcNode} */ (node));
      return;
    }

    if (k === "1" || k === "2" || k === "3") {
      const node = state.currentNodeId ? nodeMap.get(state.currentNodeId) : null;
      if (!node || node.type !== "pick") return;
      const idx = Number(k) - 1;
      const opt = /** @type {PickNode} */ (node).options[idx];
      if (opt) chooseOption(/** @type {PickNode} */ (node), opt);
    }
  }

  /**
   * Startup self-test rules (docs-driven).
   * @param {SceneFile} sf
   * @returns {string[]}
   */
  function selfTest(sf) {
    const errors = [];

    if (!sf.scene || !sf.scene.id) errors.push("Scene meta missing: scene.id");
    if (!sf.scene || !sf.scene.title || !sf.scene.title.en) errors.push("Scene meta missing: title.en");
    if (!Array.isArray(sf.nodes) || sf.nodes.length === 0) errors.push("Scene nodes missing or empty");

    const ids = new Set();
    for (const n of sf.nodes || []) {
      if (!n.id) errors.push("Node missing id");
      else {
        if (ids.has(n.id)) errors.push(`Duplicate node id: ${n.id}`);
        ids.add(n.id);
      }
      if (!n.type) errors.push(`Node ${n.id || "?"} missing type`);
    }

    for (const n of sf.nodes || []) {
      if (/** @type {any} */ (n).next && !nodeMap.has(/** @type {any} */ (n).next)) {
        errors.push(`Node ${n.id} has invalid next: ${/** @type {any} */ (n).next}`);
      }

      if (n.type === "npc") {
        const npc = /** @type {NpcNode} */ (n);
        if (!npc.speaker) errors.push(`NPC node ${npc.id} missing speaker`);
        if (!npc.line || !npc.line.en) errors.push(`NPC node ${npc.id} missing line.en`);
        if (!npc.next) errors.push(`NPC node ${npc.id} missing next`);
        if (npc.next && !nodeMap.has(npc.next)) errors.push(`NPC node ${npc.id} next invalid: ${npc.next}`);
      }

      if (n.type === "pick") {
        const pick = /** @type {PickNode} */ (n);
        if (!pick.prompt || !pick.prompt.en) errors.push(`Pick node ${pick.id} missing prompt.en`);
        if (!Array.isArray(pick.options) || pick.options.length !== 3) {
          errors.push(`Pick node ${pick.id} must have exactly 3 options`);
        }

        const opts = Array.isArray(pick.options) ? pick.options : [];
        const gracefulCount = opts.filter((o) => o.isGracefulExit === true).length;
        if (pick.isTeasingBeat === true) {
          if (gracefulCount !== 1) {
            errors.push(
              `Teasing pick node ${pick.id} must have exactly 1 graceful exit option. Found: ${gracefulCount}`
            );
          }
        }

        for (const o of opts) {
          if (!o.id) errors.push(`Pick node ${pick.id} option missing id`);
          if (!o.en) errors.push(`Pick node ${pick.id} option ${o.id || "?"} missing en`);
          if (!o.quality) errors.push(`Pick node ${pick.id} option ${o.id || "?"} missing quality`);
          if (!o.intent) errors.push(`Pick node ${pick.id} option ${o.id || "?"} missing intent`);
          if (!o.npcReaction || !o.npcReaction.followupNode) {
            errors.push(`Pick node ${pick.id} option ${o.id || "?"} missing npcReaction.followupNode`);
          }
          if (o.npcReaction?.followupNode && !nodeMap.has(o.npcReaction.followupNode)) {
            errors.push(
              `Pick node ${pick.id} option ${o.id} followupNode invalid: ${o.npcReaction.followupNode}`
            );
          }
          if (o.isGracefulExit === true) {
            if (o.quality !== "natural") {
              errors.push(`Graceful exit option must be quality natural. Node ${pick.id} option ${o.id}`);
            }
            if (o.intent !== "exit") {
              errors.push(`Graceful exit option must have intent exit. Node ${pick.id} option ${o.id}`);
            }
          }
        }
      }

      if (n.type === "end") {
        const end = /** @type {EndNode} */ (n);
        if (!end.line || !end.line.en) errors.push(`End node ${end.id} missing line.en`);
        if (!end.ending) errors.push(`End node ${end.id} missing ending`);
      }
    }

    return errors;
  }

  async function init() {
    updateRatePitchLabels();
    initVoices();
    setChips();

    try {
      scene = await loadSceneFile();
      buildNodeMap(scene.nodes);
    } catch (err) {
      renderStartupErrorMessage(String(err instanceof Error ? err.message : err));
      return;
    }

    const errors = selfTest(scene);
    if (errors.length) {
      renderStartupErrors(errors);
      return;
    }

    start();
  }

  // Wire UI events
  toggleSubsBtn.addEventListener("click", toggleSubs);
  toggleExplainBtn.addEventListener("click", toggleExplain);
  replayBtn.addEventListener("click", replayLast);
  voiceBtn.addEventListener("click", toggleVoicePanel);
  restartBtn.addEventListener("click", start);

  rateRange.addEventListener("input", updateRatePitchLabels);
  pitchRange.addEventListener("input", updateRatePitchLabels);

  overlayEnable.addEventListener("click", enableAudio);
  overlayNoAudio.addEventListener("click", disableAudio);

  document.addEventListener("keydown", handleKey);

  void init();
})();

