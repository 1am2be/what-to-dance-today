# Dance Taxonomy

## 文档用途

本文件用于 AI 理解舞蹈训练概念、训练内容之间的关系，以及抽签推荐时的内部判断。

注意：

- 本文件不是用户界面的文案来源。
- 本文件中的专业术语允许保持舞蹈领域常用表达。
- AI 在最终向用户推荐时，应根据产品语言风格转换为自然、易懂的表达。
- dance_style 的合法枚举不由本文件定义，以 DATA_MODEL.md 为准。
- 本文件可以描述某个舞种常见的训练概念，但不代表系统支持的 dance_style 枚举。
- 本文件中的训练概念不作为用户必须选择的标签。
- 用户可以使用自然语言记录实际练习内容，
- AI 可以在后台将自然语言映射到相关训练概念。

## 用户表达原则

以下内容为内部训练概念，输出给用户时不要求逐字使用。

示例：

- Weight Transfer
  - 内部含义：重心转换相关训练
  - 用户表达可使用：重心 / 换重心 / 脚步重心

- Musicality
  - 用户表达可根据场景使用：
    - 听音乐
    - 卡音乐
    - 音乐表达
    - 跟音乐自由跳

- Body Control
  - 用户表达可使用：
    - 身体控制
    - 控制感

## Activity Types

### activity_type 规则

DATA_MODEL.md 是 activity_type 的系统枚举来源。

DANCE_TAXONOMY.md 用于解释各 activity_type 下可能包含哪些训练内容，
不重新定义 activity_type。

### 基本功

用于记录基础训练。

常见内容：

- Groove
- Isolation
- Footwork
- Coordination
- Musicality
- Control
- Texture
- Foundation
- Freestyle Drill

---

### 自学成品舞

常见阶段：

- 扒动作
- 顺动作
- 对音乐
- Clean
- 卡点
- 完整跑
- 拍摄前整理

---

### 编舞

常见阶段：

- 找歌
- 找感觉
- Freestyle找素材
- 出动作
- 调整动作
- Clean
- 完整编排
- 拍摄

---

### 上课

可记录：

- 舞种
- 老师
- 课程主题
- 是否复习

---

### 体能

常见：

- Core
- Lower Body Strength
- Upper Body Strength
- Cardio
- Mobility
- Flexibility

---

# Dance Styles

## Hiphop

常见训练概念：

- Bounce
- Rock
- Groove
- Weight Transfer
- Footwork
- Foundation
- Freestyle
- Musicality

---

## Jazz

常见训练概念：

- Isolation
- Body Control
- Hip Control
- Chest Control
- Line
- Dynamic
- Texture
- Choreography
- Musicality

---

## K-pop

常见练习：

- Choreography learning
- Clean
- Detail
- Synchronization
- Expression
- Full-out practice