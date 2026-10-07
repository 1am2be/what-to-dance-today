# Idol Dance PRODUCT.md

## 1. 产品定位

Idol Dance 是一个给 K-pop / Idol 舞蹈爱好者自用的本地练舞管理小工具。

它是一个把「我为喜欢的 Artist 学过哪些舞」「今天该复习什么」「我最近练过什么」整理清楚的小工具。

核心价值：

- 像收藏专辑一样收藏自己学过的 Idol 舞。
- 用 1 / 3 / 7 / 14 天复习节奏提醒新学舞。
- 对已掌握舞蹈提供随机复习，避免忘记旧舞。
- 用练习记录保留真实练舞痕迹。

## 2. 目标用户

主要用户是会自学、跟练、复习 Idol 舞蹈的人，尤其是：

- 经常学 K-pop / Idol 舞蹈的用户。
- 想记录自己学过哪些 Artist / Song / Scope 的用户。
- 想知道今天该复习哪几支舞的用户。
- 想把旧舞偶尔抽出来跳一跳的用户。

## 3. 产品原则

- 只做两个页面和两个核心弹窗。
- Artist 用图片呈现收藏感；Song 只用文字，降低维护成本。
- 复习动作尽量在当前页面完成，不新增复杂页面层级。
- 所有练习次数都来自 `PracticeRecord`。

## 4. 信息架构

### 页面 1：我的舞单

默认首页。用于管理和浏览用户已经学过的舞。

一级视图按 Artist 聚合，呈现为类似专辑收藏的 Artist 卡片。

Artist 卡片展示：

- Artist 图片
- Artist Name
- 已学 X 支舞

点击 Artist 后进入该 Artist 的歌曲列表视图。

Artist 内页展示：

- Artist 图片
- Artist Name
- X 支舞 · X 次练习
- Song / Dance 列表

Dance 列表项展示：

- Song Title
- Scope
- 练习 X 次
- 状态标签：待复习 / 复习中 / 已掌握

点击 Dance 后在当前页展开详情，不进入新页面。

Dance 展开信息：

- Song Title
- Scope
- 累计练习次数
- 学习日期
- 最近练习日期
- 当前复习状态
- 下一次建议复习日期，已掌握时不显示
- 记一次复习
- 编辑学习范围

### 页面 2：练舞记录

用于查看最近练过什么。

页面信息层级：

- 页面标题：练舞记录
- 右上角按钮：+ 记录
- 轻量汇总：本月练舞 X 次
- 时间流：按练习日期倒序展示 PracticeRecord

单条记录展示：

- Artist 小头像
- Song Title
- Artist Name
- Scope
- 行为类型：学习 / 复习
- 复习说明：第 X 次复习 / 已掌握舞

点击单条记录后，跳转到「我的舞单」中对应 Dance 的展开详情。

### 弹窗 1：记录 / 添加舞蹈

用于第一次把某支舞加入 Idol Dance。

顶部两个 Tab：

- 新学的
- 以前学过

### 弹窗 2：今天复习什么

全局弹窗，可从两个页面打开。

包含两个区域：

- 今天该复习：固定复习推荐
- 随便复习几支：已掌握舞随机推荐

底部导航：

- 舞单
- 记录

全局悬浮按钮：

- ✦ 今天复习什么

## 5. 数据模型

### Artist

```ts
type Artist = {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
};
```

规则：

- `name` 必填。
- `imageUrl` 必填。
- Artist 卡片的「已学 X 支」= 该 Artist 下的 Dance 数量。
- Artist 内页的「X 次练习」= 该 Artist 下所有 PracticeRecord 数量。

### Dance

```ts
type Dance = {
  id: string;
  artistId: string;
  songTitle: string;
  scopeType: "full" | "half" | "chorus" | "custom";
  scopeText: string;
  sourceType: "new" | "old";
  state: "reviewing" | "mastered";
  reviewRound: 0 | 1 | 2 | 3 | 4;
  learnedAt: string | null;
  lastReviewAt: string | null;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
};
```

规则：

- 一支歌只有一个 Dance 档案。
- 同一 Artist 下不允许创建重复 `songTitle`。
- `artistId + songTitle` 是业务唯一键。
- `scopeType = custom` 时，`scopeText` 必填。
- `sourceType = new` 表示新学舞。
- `sourceType = old` 表示以前学过的舞。
- `state = reviewing` 表示还在固定复习周期中。
- `state = mastered` 表示已经完成固定复习，进入随机复习池。

### PracticeRecord

```ts
type PracticeRecord = {
  id: string;
  danceId: string;
  artistId: string;
  type: "learning" | "review";
  practicedAt: string;
  reviewRound: 0 | 1 | 2 | 3 | 4 | null;
  createdAt: string;
};
```

规则：

- 新学舞提交时创建一条 `learning` 记录。
- 复习舞蹈时创建一条 `review` 记录。
- 以前学过的舞加入时不创建 PracticeRecord。
- Dance 的练习次数 = 该 Dance 对应的 PracticeRecord 数量。
- Artist 的累计练习次数 = 该 Artist 下所有 PracticeRecord 数量。

## 6. 业务规则

### 新学舞

在「记录 / 添加舞蹈」弹窗中选择「今日学习」。

字段顺序：

1. Artist
2. Song Title
3. 学习范围
4. 学习日期
5. 记录学习

提交后：

- 创建 Dance。
- 创建一条 `type = learning` 的 PracticeRecord。
- `sourceType = new`
- `state = reviewing`
- `reviewRound = 0`
- `learnedAt = 学习日期`
- `lastReviewAt = null`
- `nextReviewAt = 学习日期 + 1 天`

Toast：

- 如果 `nextReviewAt` 晚于今天：`已加入舞单 · 明天开始第一次复习 ✦`
- 如果 `nextReviewAt` 已到期或逾期：`已加入舞单 · 现在已经可以复习啦`

### 以前学过

在「记录 / 添加舞蹈」弹窗中选择「以前学过」。

字段顺序：

1. Artist
2. Song Title
3. 学习范围
4. 加入我的舞单

不出现学习日期。

提交后：

- 创建 Dance。
- 不创建 PracticeRecord。
- `sourceType = old`
- `state = mastered`
- `reviewRound = 4`
- `learnedAt = null`
- `lastReviewAt = null`
- `nextReviewAt = null`

Toast：

- `已加入已掌握舞单`

### 固定复习周期

新学舞按 1 / 3 / 7 / 14 天节奏复习。

复习节点：

- 第 1 次复习：学习日期 + 1 天
- 第 2 次复习：第 1 次复习完成日期 + 3 天
- 第 3 次复习：第 2 次复习完成日期 + 7 天
- 第 4 次复习：第 3 次复习完成日期 + 14 天

用户完成一次固定复习后：

- 创建一条 `type = review` 的 PracticeRecord。
- 更新 `lastReviewAt = 本次复习日期`。
- `reviewRound += 1`。
- 如果 `reviewRound < 4`，根据本次完成日期计算下一次 `nextReviewAt`。
- 如果 `reviewRound = 4`，设置 `state = mastered`，`nextReviewAt = null`。

完成复习 Toast：

- 未掌握：`复习已记录 · 下一次建议 X 天后 ✦`
- 已掌握：`复习已记录 · 已掌握 ✦`

### 已掌握

Dance 完成第 4 次固定复习后进入 `mastered`。

已掌握舞：

- 不再显示下一次建议复习日期。
- 不再进入固定复习队列。
- 可以进入「随便复习几支」随机池。
- 被随机复习后仍然保持 `state = mastered`。
- 随机复习会创建 PracticeRecord，但不会生成新的 `nextReviewAt`。

### 待复习推荐

筛选条件：

```text
state = reviewing
nextReviewAt != null
today >= nextReviewAt
```

排序规则：

1. 复习轮次优先级：第 1 次 > 第 2 次 > 第 3 次 > 第 4 次。
2. 同一轮次内，逾期天数更多的优先。

「今天复习什么」弹窗默认展示 Top 3。

点击「查看全部待复习（X）」后，在当前弹窗内展开完整列表，不打开新弹窗。

待复习推荐是确定性推荐。

### 已掌握随机推荐

随机池：

```text
state = mastered
```

规则：

- 每次展示最多 3 支。
- 数量不足 3 支时展示实际数量。
- 点击「换一批」重新随机。
- 完成其中一支复习后，创建 PracticeRecord。
- 完成后该 Dance 可以从当前随机 3 支中临时替换，避免刚练完仍停留在推荐列表里。
- 不改变 `state`。
- 不产生 `nextReviewAt`。

### 学习范围

范围选项：

- 全曲
- 半曲
- 副歌
- 自定义

自定义范围必须填写 `scopeText`。

### 学习范围扩大

示例：

- 副歌 → 半曲
- 半曲 → 全曲
- 副歌 → 全曲
- 任意范围 → 自定义且内容明显增加

交互：

- 用户点击「编辑学习范围」。
- 在当前 Dance 展开卡片内进入编辑状态，不打开新弹窗。
- 保存时如果系统判断为范围扩大，显示确认状态：
  - 文案：`学习范围扩大后，将重新开始复习计划。之前的练习记录会保留。`
  - 主按钮：`更新并重新复习`

确认后：

- 更新 Dance 的 scope。
- 新增一条 `type = learning` 的 PracticeRecord。
- `state = reviewing`
- `reviewRound = 0`
- `learnedAt = 今天`
- `lastReviewAt = null`
- `nextReviewAt = 今天 + 1 天`
- 保留之前所有 PracticeRecord。

### 学习范围缩小

示例：

- 全曲 → 半曲
- 半曲 → 副歌

规则：

- 不重置复习计划。
- 只更新 Dance 的 scope。
- Toast：`学习范围已更新`

## 7. 用户路径

### 路径 A：第一次记录新学舞

1. 用户打开 App，默认进入「我的舞单」。
2. 空状态展示「记录第一支舞」。
3. 用户打开「记录 / 添加舞蹈」弹窗。
4. 选择「新学的」。
5. 选择或新增 Artist。
6. 输入 Song Title。
7. 选择学习范围。
8. 选择学习日期，默认今天。
9. 点击「记录学习」。
10. 系统创建 Dance 和 learning PracticeRecord。
11. 返回「我的舞单」，看到 Artist 卡片和对应 Dance。

### 路径 B：加入以前学过的舞

1. 用户打开「记录 / 添加舞蹈」弹窗。
2. 选择「以前学过」。
3. 选择或新增 Artist。
4. 输入 Song Title。
5. 选择学习范围。
6. 点击「加入我的舞单」。
7. 系统创建 mastered Dance，不创建 PracticeRecord。
8. 该 Dance 可进入随机旧舞池。

### 路径 C：不知道今天练什么

1. 用户点击全局「✦ 练什么」按钮。
2. 系统展示「今天该复习」Top 3。
3. 系统展示「随便复习几支」随机 3 支已掌握舞。
4. 用户点击某支舞的「复习」。
5. 按钮进入确认状态。
6. 用户点击「完成复习」。
7. 系统创建 review PracticeRecord，并更新 Dance 状态。

### 路径 D：从舞单复习某支舞

1. 用户进入「我的舞单」。
2. 点击 Artist。
3. 点击 Dance。
4. Dance 卡片展开。
5. 用户点击「记一次复习」。
6. 按钮进入确认状态。
7. 用户点击「完成复习」。
8. 系统创建 PracticeRecord 并更新复习计划。

### 路径 E：修改学习范围

1. 用户进入 Dance 展开详情。
2. 点击「编辑学习范围」。
3. 修改范围。
4. 点击保存。
5. 如果范围缩小，只保存 scope。
6. 如果范围扩大，提示会重置复习计划。
7. 用户确认后，系统保留历史记录并重新开始固定复习。

## 8. 交互规则

### 全局

- 关闭弹窗不应清空已保存的数据。
- 保存失败时，保留用户已输入内容。
- 复习确认使用页面内短确认状态，不新增第三个核心弹窗。
- 日期选择可以使用系统日期选择器，不算核心弹窗。

### Artist

- 新增 Artist 时必须填写 Artist Name 和上传 Artist 图片。
- 选择已有 Artist 时展示头像 + 名称。
- Artist 只展示 Artist Name 和已学 X 支。

### Song / Dance

- Song Title 输入后实时检查重复。
- 重复判断维度是 `artistId + songTitle`。
- 不允许同一 Artist 下创建两个同名 Dance。
- Dance 卡片默认展示 Song Title、Scope、练习次数和轻量状态。
- 复杂复习信息只在展开态展示。

### 记一次复习

点击「记一次复习」后：

- 当前按钮区域变成确认状态。
- 文案：`今天复习了 {songTitle} · {scopeText}？`
- 主按钮：`完成复习`
- 次按钮：`取消`

点击完成后：

- 创建 PracticeRecord。
- 更新 Dance。
- 显示 Toast。

## 9. 空状态与错误提示

### 我的舞单为空

标题：

```text
舞单还是空的
```

说明：

```text
先记录一支学过的舞吧。
```

按钮：

```text
添加第一支舞
```

### 练舞记录为空

标题：

```text
还没有练舞记录
```

说明：

```text
第一支Ta们的舞✦
```

按钮：

```text
记录第一支舞
```

### 今天复习什么：没有任何 Dance

标题：

```text
舞单还是空的
```

说明：

```text
先记录一支学过的舞吧。
```

按钮：

```text
添加第一支舞
```

### 练什么：有舞但今天没有待复习

标题：

```text
今天没有必须复习的舞
```

说明：

```text
记得不错 ✦
```

下面仍展示「随便复习几支」随机区。

### 练什么：没有已掌握 Dance

标题：

```text
还没有已掌握的舞
```

说明：

```text
完成 4 次复习后，它们会来到这里。
```

### 表单错误

Artist 未上传图片：

```text
请上传 Artist 图片
```

Song Title 为空：

```text
请输入歌名
```

没有选择范围：

```text
请选择学习范围
```

自定义范围为空：

```text
请填写具体学习范围
```

学习日期为未来：

```text
学习日期不能晚于今天
```

重复 Dance：

```text
这首舞已经在你的舞单里了
```

保存失败：

```text
保存失败，请再试一次
```

重复 Dance 的辅助操作：

```text
查看并编辑
```

点击后关闭弹窗，并定位到已有 Dance。

## 10. 验收标准

### 信息架构

- App 只有两个主页面：我的舞单、练舞记录。
- App 只有两个核心弹窗：记录 / 添加舞蹈、练什么。
- 默认首页是「我的舞单」。
- 两个页面都可以打开「练什么」弹窗。

### 数据模型

- 可以创建 Artist、Dance、PracticeRecord。
- 同一 Artist 下不能创建重复 Song Title。
- Dance 练习次数准确等于其 PracticeRecord 数量。
- Artist 已学舞数准确等于其 Dance 数量。
- Artist 累计练习次数准确等于其所有 PracticeRecord 数量。

### 新学舞

- 新学舞提交后创建 Dance 和 learning PracticeRecord。
- 新学舞初始状态为 `reviewing`。
- 新学舞初始 `reviewRound = 0`。
- 新学舞初始 `nextReviewAt = learnedAt + 1 天`。
- 学习日期不能选择未来。

### 以前学过

- 以前学过提交后只创建 Dance。
- 不创建 PracticeRecord。
- 初始状态为 `mastered`。
- `nextReviewAt = null`。
- 该 Dance 能进入随机旧舞池。

### 固定复习

- 系统按 1 / 3 / 7 / 14 天计算固定复习。
- 每次完成复习都会创建 review PracticeRecord。
- 完成第 4 次复习后 Dance 进入 `mastered`。
- 已掌握 Dance 不再出现在固定待复习列表中。

### 练什么

- 待复习区只展示到期或逾期的 reviewing Dance。
- 默认展示 Top 3。
- Top 3 排序符合：复习轮次优先，再按逾期天数排序。
- 查看全部待复习在当前弹窗内展开，不打开新弹窗。
- 已掌握随机区最多展示 3 支 mastered Dance。
- 换一批只影响已掌握随机区。
- 随机旧舞复习后不生成下一次复习日期。

### 范围修改

- 范围缩小时不重置复习计划。
- 范围扩大时必须提示用户会重新开始复习计划。
- 范围扩大确认后保留所有历史 PracticeRecord。
- 范围扩大确认后新增 learning PracticeRecord，并从 `reviewRound = 0` 重新开始。

### 空状态和错误

- 所有空状态文案按本文件实现。
- 所有核心表单错误按本文件实现。
- 保存失败后不清空用户已输入内容。
