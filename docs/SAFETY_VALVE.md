## 文档 3. 体面退出安全阀规则清单 / Graceful exit safety valve rules

### 目的 / Purpose

轻度打趣调侃为主会更上头, 但也更容易越界或让用户学到不合时宜的话. 安全阀确保任何时刻都能体面收束, 同时保持轻松氛围.

Leading with light teasing is engaging, but also increases the risk of crossing lines or teaching contextually inappropriate lines. The safety valve ensures users can always exit gracefully while keeping the vibe light.

### 核心规则 / Core rules

规则 1. 每个 teasing 节点必须有且只有一个明确的 graceful exit 选项, quality 必须是 natural, intent 必须是 exit.

Rule 1. Every teasing beat must include exactly one clear graceful exit option, quality must be natural, intent must be exit.

规则 2. NPC 必须接住 exit. 反应为中性或积极, 不允许惩罚玩家, 不允许用冷场羞辱.

Rule 2. NPC must accept the exit. Reaction must be neutral or positive, no punishment, no shaming cooldown.

规则 3. graceful exit 的语义必须可进可退. 既能结束对话, 也能为下次对话留余地.

Rule 3. A graceful exit must be reversible. It ends the moment but leaves the door open for future interaction.

规则 4. 如果玩家连续两次选择偏冒犯或过界表达, 系统必须立刻降温并自动把下一题设计为退出友好题, 且提供更强的 exit 选项.

Rule 4. If the player selects boundary crossing lines twice in a row, the system must cool down immediately and steer the next beat toward an easy exit, offering a stronger exit line.

规则 5. teasing 的边界. 不涉及身体露骨, 不涉及职场不适当暗示, 不涉及权力关系压迫, 不涉及让人无法拒绝的表达.

Rule 5. Teasing boundaries: no explicit body talk, no workplace inappropriate sexual implications, no power pressure, no lines that remove the other person’s ability to decline.

### 允许的 teasing 类型 / Allowed teasing types

俏皮的轻夸. 语气轻, 不强迫对方回应.

Playful light compliments that do not demand a response.

自嘲式幽默. 把笑点放自己身上, 风险更低.

Self deprecating humor, safer because the joke is on the speaker.

对情境的调侃. 调侃事件或共同处境, 不调侃对方的敏感点.

Situational teasing, joke about the moment not personal sensitive traits.

### graceful exit 句型库建议 / Suggested graceful exit patterns

这些是结构模式, 不是固定答案. 内容生产时按场景替换细节.

These are patterns, not fixed lines. Fill details per scene.

模式 A. 轻松收尾加回头见.

Pattern A. Light wrap plus see you later.

例. I should jump back in. Catch you later.

例. そろそろ戻るね. またね.

模式 B. 把话题转中性, 再顺势结束.

Pattern B. Pivot to neutral then end.

例. Anyway, hope the rest of your day is smooth. I’m off.

例. とにかく, 今日も無理しないでね. じゃ, 戻るよ.

模式 C. 承认玩笑, 同时收住.

Pattern C. Acknowledge the joke and soften.

例. I’m kidding. You’re doing great. I’ll let you focus.

例. 冗談だよ. いい感じだよ. 集中させてあげるね.

### 验收测试用例 / Acceptance test cases

用例 1. 选择 awkward 后, 必须出现非语言信号, 且下一句明显更短或转话题.

Case 1. After an awkward choice, a nonverbal cue must occur, and the next turn must be shorter or topic shifting.

用例 2. 在 teasing 节点选择 graceful exit 后, NPC 必须给温和收尾, 并结束或转中性话题, 不出现惩罚语气.

Case 2. After choosing graceful exit on a teasing beat, NPC must close warmly and end or pivot neutrally, no punitive tone.

用例 3. 连续两次越界, 系统必须触发降温路径并给强退出.

Case 3. Two boundary crossing choices in a row must trigger a cooldown path and a strong exit.

