# Data Model

## Goal

一个阶段性练舞目标。

字段：

## Goal

字段：

- id
- start_date
- end_date
- duration_days

- activity_type
- dance_style
- focus_concepts[]

- title
- note

- metric
- target_value
- unit

- status

### activity_type

可选：

- 基本功
- 体能
- 自学成品舞
- 上课
- 编舞
- Freestyle
- 拍摄
- 发布作品
- 其他

### dance_style

可选：

- Hiphop
- Jazz
- K-pop
- Waacking
- Popping
- House
- Locking
- Choreography
- Breaking
- Voguing
- Krump
- Turfing
- 其他

允许用户自定义。

### dance_style 规则

DATA_MODEL.md 是系统 dance_style 枚举的唯一来源。

其他文档（包括 DANCE_TAXONOMY.md）可以描述某些舞种的训练知识，
但不得额外定义系统 dance_style 枚举。

系统允许用户创建自定义 dance_style。

内置 dance_style 与用户自定义 dance_style 应在数据层区分。

### focus_concepts

### focus_concepts

可选。

用于记录用户本次或本阶段具体想练 / 实际练到的内容。

focus_concepts 以用户自定义文本为主，不要求从固定枚举中选择。

示例：

- 中段基本功
- 臀部基本功
- 手臂协调
- 脚步
- groove
- clean
- 副歌
- freestyle

系统可以根据用户历史输入提供补全建议。

DANCE_TAXONOMY.md 仅用于 AI 内部理解、归类和推荐，
不作为 focus_concepts 的合法值列表。

### status

- active
- completed
- paused

### 量化目标

metric / target_value / unit 均为可选字段。

只有目标天然适合量化时才使用。

示例：

目标：
7天内扒3支 Jazz

metric: works_completed
target_value: 3
unit: pieces

---

目标：
最近3天集中练 Hiphop 脚步

metric: null
target_value: null
unit: null

focus_concepts:
- footwork

---

## PracticeRecord

一次练舞记录。

字段：

- id
- date
- duration_minutes
- activity_types[]
- dance_styles[]
- note
- related_goal_ids[]
- work_name
- created_at
- focus_concepts[]

### 说明

一次记录可以同时包含多个 activity_type。

例如：

60分钟练舞：

activity_types:
- 基本功
- 自学成品舞

dance_styles:
- Hiphop

focus_concepts:
- footwork
- groove

note:
练了脚步，然后顺了两遍成品。

不要求分别记录：
基本功20分钟 / 成品40分钟。

---

## Work

可选。

用于记录具体作品。

字段：

- id
- name
- type
- dance_style
- status

例如：

name:
Whiplash

type:
自学成品舞