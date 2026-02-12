## 文档 2. 场景脚本数据结构与内容生产模板 / Script schema and production template

### 目标 / Goal

这份模板用于稳定产出内容, 保证每个节点可控, 可测试, 可扩展到任何语言.

This template standardizes content production so each node is controllable, testable, and scalable to any language.

### 写作规则摘要 / Writing rules summary

每个选择题都要标注意图与语气, 并写清楚 NPC 的非语言反应与下一句走向. 每个 teasing 节点必须提供体面退出选项.

Each choice must carry intent and tone, and specify NPC nonverbal reaction plus next turn. Every teasing beat must include a graceful exit option.

### 数据结构建议 / Recommended structure

下面是一个最小可用的 JSON 结构示例. 字段名保持英文便于工程实现, 但每段文本都包含英文内容与中文日文辅助.

Below is a minimal JSON structure. Field names stay in English for engineering, while each line includes English plus Chinese and Japanese support.

```json
{
  "scene": {
    "id": "office_pantry_01",
    "title": { "en": "Office Pantry . Late Afternoon", "zh": "办公室茶水间. 下午", "ja": "オフィスの給湯室. 夕方" },
    "context": {
      "location": "office pantry",
      "time": "late afternoon",
      "relationship": "familiar coworkers",
      "vibe": ["light", "playful", "safe-flirty"]
    },
    "characters": {
      "npcA": { "id": "maya", "displayName": "Maya", "role": "coworker", "styleTags": ["warm", "witty"] },
      "player": { "id": "you", "displayName": "You", "role": "player" }
    }
  },
  "nodes": [
    {
      "id": "n001",
      "type": "npc",
      "speaker": "maya",
      "line": {
        "en": "You look way too focused today. Are you secretly auditioning for Employee of the Month?",
        "zh": "你今天也太认真了吧. 你是在偷偷竞争月度员工吗?",
        "ja": "今日やけに真面目だね. 月間MVPでも狙ってるの?"
      },
      "voice": { "engine": "local_tts", "voiceHint": "female_default", "rate": 1.0, "pitch": 1.0 },
      "nonverbal": { "face": "smirk", "gaze": "direct", "beat": "light-laugh" },
      "next": "n002"
    },
    {
      "id": "n002",
      "type": "pick",
      "prompt": {
        "en": "Pick a natural, playful reply.",
        "zh": "选一句自然又俏皮的回复.",
        "ja": "自然で軽いノリの返しを選んで."
      },
      "options": [
        {
          "id": "o1",
          "en": "Only if the prize is extra coffee. I’m very easy to bribe.",
          "zh": "除非奖品是多一杯咖啡. 我可太好收买了.",
          "ja": "賞品がコーヒー増量ならね. 私, 買収されやすいタイプ.",
          "quality": "natural",
          "intent": "tease",
          "tone": ["playful", "warm"],
          "isGracefulExit": false,
          "npcReaction": {
            "nonverbal": { "face": "laugh", "gaze": "soft", "beat": "quick" },
            "followupNode": "n003"
          },
          "explain": {
            "en": "Self-deprecating humor keeps it light and inviting.",
            "zh": "自嘲式幽默很轻松, 也更容易把对话往下接.",
            "ja": "自虐気味のユーモアで空気が軽くなり, 会話が続きやすい."
          }
        },
        {
          "id": "o2",
          "en": "Yes. I am pursuing excellence and maximizing productivity.",
          "zh": "是的. 我在追求卓越并最大化生产力.",
          "ja": "はい. 私は卓越性を追求し生産性を最大化しています.",
          "quality": "awkward",
          "intent": "respond",
          "tone": ["stiff", "formal"],
          "isGracefulExit": false,
          "npcReaction": {
            "nonverbal": { "face": "pause", "gaze": "blink", "beat": "awkward-silence" },
            "followupNode": "n003_cooldown"
          },
          "explain": {
            "en": "It sounds like a report, not small talk.",
            "zh": "像汇报, 不像闲聊.",
            "ja": "雑談というより報告っぽく聞こえる."
          }
        },
        {
          "id": "o3",
          "en": "Ha, maybe. Anyway, I should get back to it. Catch you later.",
          "zh": "哈哈也许吧. 我得回去继续忙了. 回头见.",
          "ja": "まあね. そろそろ戻るよ. またね.",
          "quality": "natural",
          "intent": "exit",
          "tone": ["polite", "easy"],
          "isGracefulExit": true,
          "npcReaction": {
            "nonverbal": { "face": "smile", "gaze": "nod", "beat": "accepting" },
            "followupNode": "n_end_soft"
          },
          "explain": {
            "en": "A graceful exit saves face and keeps the relationship warm.",
            "zh": "体面退出既不尴尬, 也能保持关系温度.",
            "ja": "角が立たない終わらせ方で, 関係性も保てる."
          }
        }
      ],
      "next": null
    }
  ],
  "recap": {
    "threePanel": true,
    "oneAlternativeLine": true,
    "oneTransferQuestion": true
  }
}
```

### Field notes (与当前工程对齐) / Field notes (aligned to this repo)

- 当前工程的场景文件位于 `scenes/office_pantry_01.json`.
  - The working scene file lives at `scenes/office_pantry_01.json`.
- 字段名保持英文, 且不要随意改 schema.
  - Keep field names in English and do not change the schema casually.
- `scene.title` 与 `prompt`/`line` 等文本采用多语言对象 (`en`/`zh`/`ja`), 其中英语是学习目标语言, 中日文为辅助.
  - Text fields are localized objects (`en`/`zh`/`ja`). English is the learning language; Chinese/Japanese are support languages.
- `nodes[]` 目前使用 `type: "npc" | "pick" | "end"` 三类节点.
  - Nodes currently use `type: "npc" | "pick" | "end"`.
- 在 `pick` 节点里, `options[]` 的每个 option 都应包含:
  - In `pick` nodes, each `options[]` item should include:
  - `quality`: `natural` / `off` / `awkward`
    - `off` 对应 PRD 中的 “Understandable but off” (能懂但不太得体/不合语境)
  - `intent`: 例如 `tease`, `exit`, `respond`, `challenge`
  - `tone`: 语气标签数组 (例如 `playful`, `warm`, `formal`, `cold`)
  - `npcReaction.followupNode`: 选项导致的下一节点 id
  - `npcReaction.nonverbal`: NPC 的非语言反馈 (用于“后果可感知”)
  - `isGracefulExit`: 是否为体面退出选项
- `isTeasingBeat` (在 `pick` 节点上) 用于标记“打趣/暧昧式玩笑”的节点, 并与“安全阀”规则配套.
  - `isTeasingBeat` (on `pick`) marks teasing beats and pairs with safety-valve rules.

### 生产清单 / Production checklist

#### 每个 scene 必须 / Each scene must

- 场景标题三语 / Tri-language title
- 关系与氛围标签 / Relationship and vibe tags
- 至少 8 个节点 / At least 8 nodes
- 至少 4 次 pick / At least 4 pick nodes
- 至少 2 个 teasing 节点 / At least 2 teasing beats
- 每个 teasing 节点都有 graceful exit / Every teasing beat includes a graceful exit

#### 每个 pick 必须 / Each pick must

- 3 个选项 / Exactly 3 options
- 每个选项包含 `quality`, `intent`, `tone`, `npcReaction`, `explain`
  - Each option includes `quality`, `intent`, `tone`, `npcReaction`, `explain`
- 至少 1 个 awkward 触发非语言信号加话题走向变化
  - At least one awkward option triggers a nonverbal cue plus topic flow change

