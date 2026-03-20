# 中医知识库 API 接口文档

> 将本文档交给AI，让它按照格式整理内容并调用接口上传。

## 基本信息

- 基础URL: `https://你的域名`
- 认证方式: 所有写操作需要在请求头中携带 `Authorization: Bearer <API_KEY>`
- 数据格式: JSON (`Content-Type: application/json`)

---

## 一、创建单篇内容

**POST** `/api/content`

### 请求体

```json
{
  "title": "浮脉",
  "slug": "maizhen-fumai",
  "categorySlug": "zhenduan-maizhen",
  "summary": "轻取即得，重按稍减。主表证，亦主虚证。",
  "tags": ["脉诊", "浮脉", "表证"],
  "content": [
    {
      "type": "section",
      "heading": "脉象特征",
      "body": "举之有余，按之不足。如水中漂木，轻手可得，重手反减。"
    },
    {
      "type": "section",
      "heading": "主病",
      "body": "1. 表证：外感风寒或风热，邪气在表，正气抗邪外出，脉气鼓动于外。\n2. 虚证：久病体虚，阳气不能潜藏。"
    },
    {
      "type": "table",
      "heading": "相似脉鉴别",
      "headers": ["脉名", "特征", "区别要点"],
      "rows": [
        ["浮脉", "轻取即得", "脉位在表"],
        ["洪脉", "浮大有力", "脉势涌盛如波涛"],
        ["虚脉", "浮大无力", "按之空虚"]
      ]
    },
    {
      "type": "quote",
      "source": "《濒湖脉学》",
      "body": "浮脉惟从肉上行，如循榆荚似毛轻。三秋得令知无恙，久病逢之却可惊。"
    }
  ],
  "references": ["《濒湖脉学》", "《脉经》"],
  "relations": ["maizhen-chenmai", "maizhen-hongmai"],
  "sortOrder": 1
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| title | 是 | 标题 |
| slug | 否 | URL标识，不填则自动生成。建议格式：`分类slug-名称拼音` |
| categorySlug | 是 | 分类标识（见下方分类列表） |
| summary | 否 | 摘要 |
| content | 是 | 内容块数组（见下方内容块类型） |
| tags | 否 | 标签数组 |
| references | 否 | 参考文献数组 |
| relations | 否 | 关联内容的slug数组 |
| sortOrder | 否 | 排序序号，默认0 |

### 内容块类型 (content type)

#### 1. section - 段落

```json
{
  "type": "section",
  "heading": "标题",
  "body": "正文内容，支持\\n换行"
}
```

#### 2. table - 表格

```json
{
  "type": "table",
  "heading": "表格标题（可选）",
  "headers": ["列1", "列2", "列3"],
  "rows": [
    ["数据1", "数据2", "数据3"],
    ["数据4", "数据5", "数据6"]
  ]
}
```

#### 3. quote - 经典引用

```json
{
  "type": "quote",
  "source": "出处，如《黄帝内经》",
  "body": "引用原文"
}
```

#### 4. list - 列表

```json
{
  "type": "list",
  "heading": "列表标题（可选）",
  "items": ["第一条", "第二条", "第三条"],
  "ordered": false
}
```

#### 5. image - 图片

```json
{
  "type": "image",
  "url": "图片URL（先通过上传接口获取）",
  "caption": "图片说明（可选）"
}
```

#### 6. formula - 方剂组成

```json
{
  "type": "formula",
  "heading": "方剂名（可选）",
  "herbs": [
    { "name": "麻黄", "amount": "9g", "role": "君" },
    { "name": "桂枝", "amount": "6g", "role": "臣" },
    { "name": "杏仁", "amount": "9g", "role": "佐" },
    { "name": "甘草", "amount": "3g", "role": "使" }
  ],
  "preparation": "以水九升，先煮麻黄减二升，去上沫...",
  "usage": "温服，覆取微似汗"
}
```

---

## 二、批量导入

**POST** `/api/content/import`

### JSON格式批量导入

```json
{
  "format": "json",
  "articles": [
    { "title": "...", "categorySlug": "...", "content": [...] },
    { "title": "...", "categorySlug": "...", "content": [...] }
  ]
}
```

### Markdown格式批量导入

```json
{
  "format": "markdown",
  "articles": [
    "# 浮脉\n\n## 脉象特征\n\n举之有余...\n\n## 主病\n\n- 表证\n- 虚证",
    "# 沉脉\n\n## 脉象特征\n\n重手按至筋骨..."
  ]
}
```

> 注意：Markdown导入时需要单独指定 categorySlug，建议用JSON格式更精确。

---

## 三、上传图片

**POST** `/api/upload`

Content-Type: `multipart/form-data`

| 字段 | 说明 |
|------|------|
| file | 图片文件（支持jpg/png/gif/webp/svg，最大10MB） |

### 响应

```json
{
  "url": "https://your-s3.com/images/xxx.jpg",
  "key": "images/xxx.jpg"
}
```

---

## 四、查询接口

### 获取分类列表

**GET** `/api/categories`

### 获取内容列表

**GET** `/api/content?category=zhenduan-maizhen&page=1&pageSize=20`

### 获取单篇内容

**GET** `/api/content/{id或slug}`

### 搜索

**GET** `/api/search?q=关键词&category=zhongyao&tags=清热,解毒&page=1`

| 参数 | 说明 |
|------|------|
| q | 搜索关键词（匹配标题、摘要、正文、标签） |
| category | 分类筛选 |
| tags | 标签筛选，逗号分隔 |
| page | 页码，默认1 |
| pageSize | 每页数量，默认20 |

### 获取图谱数据

**GET** `/api/graph?category=zhongyao`

---

## 五、修改与删除

### 更新内容

**PUT** `/api/content/{id}`

请求体与创建相同，只需包含要修改的字段。

### 删除内容

**DELETE** `/api/content/{id}`

---

## 六、分类标识速查

### 大类

| slug | 名称 |
|------|------|
| jichu | 基础理论 |
| zhenduan | 诊断方法 |
| zhongyao | 中药学 |
| fangji | 方剂学 |
| jingluo | 经络腧穴 |
| zhenjiu | 针灸学 |
| tuina | 推拿按摩 |
| baguan | 拔罐疗法 |
| guasha | 刮痧疗法 |
| shiliao | 食疗药膳 |
| gongfa | 养生功法 |
| dianji | 中医典籍 |
| linchuang | 临床各科 |
| tizhi | 体质辨识 |
| mingyi | 名医传承 |
| waizhi | 中药外治 |
| minjian | 民间疗法 |
| jiehe | 中西医结合 |

### 小类示例（以脉诊为例）

| slug | 名称 |
|------|------|
| zhenduan-maizhen | 脉诊/切诊 |

> 完整小类列表请调用 `GET /api/categories` 获取。

---

## 七、给AI的提示词模板

将以下内容作为提示词发给AI，让它帮你整理并上传内容：

```
请帮我搜索整理关于"【主题】"的中医知识，按照以下JSON格式输出，然后调用API上传：

API地址：POST https://你的域名/api/content
请求头：Authorization: Bearer 你的API_KEY
Content-Type: application/json

请求体格式：
{
  "title": "标题",
  "slug": "分类-拼音标识",
  "categorySlug": "分类slug（参考分类表）",
  "summary": "一句话概要",
  "tags": ["标签1", "标签2"],
  "content": [
    内容块数组，支持以下类型：
    - section: {"type":"section", "heading":"标题", "body":"正文"}
    - table: {"type":"table", "headers":["列1"], "rows":[["值1"]]}
    - quote: {"type":"quote", "source":"出处", "body":"原文"}
    - list: {"type":"list", "items":["项1","项2"]}
    - formula: {"type":"formula", "herbs":[{"name":"药名","amount":"剂量","role":"君臣佐使"}]}
  ],
  "references": ["参考书籍"],
  "relations": ["关联内容的slug"]
}

要求：
1. 内容要准确，引用经典原文
2. 适当使用table展示对比信息
3. 方剂必须用formula类型，标注君臣佐使
4. 经典原文用quote类型并注明出处
```
