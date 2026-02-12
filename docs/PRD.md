## PRD v1.1 让语言回到环境里 / Put Language Back Into Context

### 1 一句话定位 / One liner

让语言回到环境里. 通过沉浸式场景与互动选择, 让用户自然习得语气, 分寸, 潜台词与表达效果. 初期做英语, 长期可扩展到任意语言.

Put language back into context. Through immersive scenes and interactive choices, learners naturally acquire tone, social calibration, subtext, and communicative impact. Start with English, expand to any language later.

### 2 目标用户与边界 / Target users and boundaries

目标用户为 CEFR B1 到 B2. 能理解常见英语, 但在真实互动里缺少说得自然得体的把握, 想提升 small talk 与社交分寸.

Target users are CEFR B1 to B2. They understand common English but struggle to sound natural and socially calibrated in real interactions, especially in small talk.

MVP 暂不覆盖 A0 到 A2, 以及 C1 以上. 前者卡理解, 后者需要更复杂文化与策略层.

MVP does not target A0 to A2 or advanced C1+. Beginners get blocked by comprehension, advanced users need deeper cultural and strategic layers.

### 3 核心理念与真实定义 / Core philosophy and realness

语言由环境塑造. 很多差别存在于语境里, 难以文字化量化, 必须用体验让用户感受到.

Language is shaped by environment. Many differences live in context and are hard to fully quantify in text, they must be felt through experience.

真实的验收标准四条. 行为真实, 关系真实, 情绪真实, 后果真实.

Realness has four acceptance rules: believable behavior, relationship, emotion, and consequence.

### 4 差异化三根柱子 / Differentiation pillars

环境可读. 新用户进入场景 3 秒内能说出地点, 人物关系, 当前氛围, 正在发生的事.

Readable context. New users can state location, relationship, vibe, and what is happening within 3 seconds.

后果可感知. 选项结果主要通过 NPC 的停顿, 语气变化, 表情反应, 话题走向呈现, 文本解释只做轻补充.

Felt consequences. Outcomes are primarily acted via pauses, tone shifts, facial reactions, and topic flow, with text explanations as light support.

训练语用能力. 每题差异必须来自意图与分寸, 继续聊, 结束聊, 共情, 调侃, 轻微暧昧式玩笑等, 不是语法做题.

Pragmatics first. Differences must be driven by intent and calibration, continue, exit, empathize, tease, light playful flirt, not grammar drills.

### 5 MVP 范围 / MVP scope

首发三个场景. 办公室茶水间熟同事闲聊, 电梯偶遇不熟同事短对话, 咖啡店或餐馆点单加轻互动. 基调轻松幽默, 寓教于乐.

Launch with three scenes: office pantry small talk with familiar coworkers, elevator quick chat with less familiar colleagues, and cafe or restaurant ordering plus light interaction. Tone is light and humorous.

每个场景 8 到 12 个对话节点. 每 1 到 2 节点触发一次三选一. 场景结束 30 秒内复盘并给 1 题迁移小测.

Each scene has 8 to 12 nodes. A 3 choice selection appears every 1 to 2 nodes. End with a 30 second recap plus one transfer question.

### 6 体验闭环 / Experience loop

场景提示出关键信息. NPC 说话并播放音频. 用户三选一并可先试听每个候选. NPC 依据选择演出后果并继续. 系统给轻量解释并可收藏. 结尾用三格回放加一句替换加一题迁移收束.

Scene presents key context. NPC speaks with audio. User selects 1 of 3 and can preview each option. NPC acts the consequence and continues. System gives a light explanation and saves a card. Close with 3 panel replay plus one alternative line plus one transfer question.

### 7 内容规范 / Content rules

每题必须包含 1 个 Most natural, 1 个 Understandable but off, 1 个 Awkward. 三者差异必须来自关系, 氛围, 意图与语气.

Each prompt must include 1 Most natural, 1 Understandable but off, 1 Awkward. Differences must come from relationship, vibe, intent, and tone.

轻微暧昧式玩笑为主. 同时必须配置常驻安全阀. 每个 teasing 节点必须有 1 条体面退出选项, 且 NPC 必须能自然接住并不惩罚玩家.

Light playful flirt is the main flavor, with a constant safety valve. Every teasing beat must include one graceful exit option, and NPC must accept it naturally without punishing the player.

### 8 非语言表达验收 / Nonverbal acceptance

Awkward 选项必须触发至少一种可感知非语言信号, 例如停顿, 语气降温, 反应节奏变短, 话题被转移. Natural 选项必须体现更顺畅推进.

Awkward options must trigger at least one perceivable nonverbal cue, such as a pause, cooler tone, shorter pacing, or topic shift. Natural options must feel smoother and more inviting.

### 9 音频策略 / Audio strategy

MVP 默认使用本地 TTS, 目标是零成本. 必须支持 replay 与候选试听. 架构预留后续切换高质量音频包的接口.

MVP uses local TTS by default for near zero cost. It must support replay and option preview. Architecture should allow switching to high quality packaged audio later.

### 10 多语言 / Localization

MVP 支持中文与日语作为辅助语言, 默认隐藏, 可随时开启. 学习目标语言为英语, 对话本体为英语.

MVP supports Chinese and Japanese as support languages, hidden by default and toggleable. English is the learning language, all dialogue is in English.

### 11 成功指标 / Success metrics

体验指标. 首次选择时间, 首场景完成率, 候选试听与 replay 使用率.

Experience metrics: time to first selection, first scene completion rate, option preview and replay usage rate.

学习指标. 二刷同场景 Most natural 比例提升, 迁移小测正确率提升, 收藏卡回看率及回看后提升.

Learning metrics: higher Most natural rate on second run, improved transfer question accuracy, card revisit rate and post revisit improvement.

### 12 交付给 Lovable 的实现目标 / Handoff target for Lovable

只要先把 1 个场景做成可玩原型即可. 必须跑通一整套闭环, 场景可读, 后果可感知, 语用差异明确. UI 细节可后续再精修.

First, build one playable scene prototype. It must complete the full loop with readable context, felt consequences, and clear pragmatics differences. UI polish can come later.

