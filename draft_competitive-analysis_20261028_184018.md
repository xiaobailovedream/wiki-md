# 草稿：在线 Markdown 协作平台 竞品分析

生成时间：2026-10-28 18:40
目标产品：本项目「在线 Markdown 协作平台」（团队文档协作平台定位，云端保存+账号同步，导出 MD/PDF/HTML/DOCX，附件支持外链/内嵌切换）

## 竞品范围（2026-10-28 确认）

| 类型 | 竞品 | 入选理由 |
|------|------|---------|
| 直接竞品 | StackEdit | 浏览器端 Markdown 编辑器标杆，纯网页、云同步、导出全 |
| 直接竞品 | Dillinger | 轻量开源在线 md 编辑器，拿来即用 |
| 直接竞品 | HackMD | 在线 Markdown 实时协同标杆 |
| 间接竞品 | 语雀 | 国内团队知识库，Markdown 编辑器成熟 |
| 间接竞品 | Notion | 国际团队文档标杆 |

简要提及（不深度分析）：飞书文档、Obsidian、Google Docs、掘金/简书编辑器、Vditor/markdown-it 等开源编辑器组件。

## 统一对比口径

- 功能模块统一到「功能模块级」，状态标注：✅ 已支持 / ⚠️ 部分支持或有限制 / ❌ 不支持 / 🔜  roadmap 或即将上线
- 定价统一折算为月付人民币（¥），注明汇率口径与获取日期
- 所有数据标注获取日期 2026-10-28

## 信息收集记录（获取日期统一为 2026-10-28，评测站标注其自身 fact-checked 日期）

### StackEdit（stackedit.io）
A2 功能：语法高亮 / WYSIWYG 控件（PageDown）/ 滚动同步实时预览 / 离线写作 / 协作空间与变更合并 / 内联评论与讨论 / LaTeX / UML 序列图流程图 / ABC 乐谱 / emoji；Markdown Extra、GFM、CommonMark 可切换（自称 custom flavor）。同步：Google Drive、Dropbox、GitHub（中文版含 Gitee）。发布：Blogger、WordPress、Zendesk + Handlebars 模板。导出：Markdown / HTML / PDF，**无 DOCX**。部署：Web + Chrome 扩展 + 自托管（Helm）。（来源：stackedit.io 官网、stackedit.cn；iTechGuides fact-checked 2026-09-20）
A3 定价：Free plan，无付费档，Apache License。（iTechGuides / GeekChamp，fact-checked 2026-09-20）
A4 口碑：iTechGuides 9.2/10，Markdown 编辑器类 31 个中排 1。缺点：自定义 md flavor 非标准、发布目标仅 3 家、扩展仅 Chrome。用户实测痛点：粘贴/拖拽图片后不知存到哪、需手动改路径（lawtee.com）；中文社区需自建图床（Gitea）+ Tampermonkey 插件才好用（365seal、GitHub StackEdit-PicToUrl）；导出 PDF 中文乱码、HTML 样式丢失、大文件体积异常（CSDN 排雷指南 2025-09）。

### Dillinger（dillinger.io）
A2 功能：Monaco 引擎（VS Code 同款）、多光标、查找替换、自动补全、Vim/Emacs 键位、暗色/禅模式、实时预览+同步滚动、拖拽文件、本地 autosave、初次加载后可离线。云同步：GitHub、Dropbox、Google Drive、OneDrive、Bitbucket。导出：Markdown / styled HTML / PDF，**无 DOCX**。MIT 开源，GitHub 8,285 stars。（dillinger.io；iTechGuides fact-checked 2026-09-20；nologin.tools 审计 2026-09）
A3 定价：完全免费，无付费档。
A4 口碑：iTechGuides 8.7/10（第 4/31）；nologin.tools Product Power 84/100、隐私 75/100、Availability 0/25（自动可达性测试失败）。缺点：纯 Web 无桌面端、导出仅 3 种格式、无团队/版本/权限体系（协作维度基本空白）。

### HackMD（hackmd.io，台湾，2014 年创立）
A2 功能：实时多光标协同、评论与提及、版本历史、模板、GitHub 同步、幻灯片模式、公开笔记/共享工作区/嵌入、REST API + CLI + MCP + 浏览器扩展。2026 年主打「team 与 AI agents 共享上下文层」，宣称 Markdown 比 HTML 省 80% token。合规 SOC 2、SSO/SAML；部署：云 / 自托管 / 浏览器扩展。（hackmd.io；iTechGuides fact-checked 2026-09-22；saaspartout 数据核验 2026-07）
A3 定价：Free $0（无限笔记、3 名队友、3 邀请、3 模板、20 次 GitHub push/月、单图 1MB、版本历史仅最近 10 版）；Prime $5/seat/月（年付），加全文搜索、单图 20MB、PDF 导出、无限邀请/版本/GitHub push/模板、20K API calls/月；Enterprise 定制价（SSO SAML/LDAP、自定义域名与首页、GitLab 集成、RBAC、专属客户经理）。
A4 口碑：iTechGuides 7.7/10（协作文档类第 14/34）；SaaSpartout 7.5/10。缺点：无原生桌面端、免费版版本历史仅 10 版、SSO/RBAC 需 Enterprise。
A6 市场：官网称 30K+ 团队、170 个国家、7.7M 笔记创建、1M+ API calls。

### 语雀（yuque.com，蚂蚁集团）
A2 功能：自研编辑器，支持文档/画板/工作表/数据表四类文稿；Markdown、代码块、LaTeX、PlantUML；本地视频、Office、PDF 上传在线预览；40+ 特色卡片；目录与大纲、"@"互动、权限（编辑/复制/分享/下载）、外链分享+密码+有效期。导出：单篇 Markdown / Word / PDF / HTML。安全：ISO/IEC 27001:2023、公安部三级等保、依托支付宝安全能力。（yuque.com 首页；aipuzi 2026 工具页）
A3 定价（官网 www.yuque.com/about/price 2026-10-28 抓取）：普通用户 ¥0/人/年（新建 100 篇/月、知识库 100、协作 5 人、月流量 1GB、单图 10MB、单附件 30MB）；专业会员 ¥99/人/年（无限文稿、1500 知识库、无限 AI、协作 50 人、流量 10GB、单图 20MB、单附件 500MB、单视频 500MB）；超级会员 ¥299/人/年（协作 500 人、流量 50GB、单图 50MB、单附件 2GB、单视频 2GB）。
⚠️ 口径差异：第三方来源另出现「团队专业版 ¥999/年/50 人起」「团队 VIP 连续包年 ¥198/年」「个人 VIP 连续包年 ¥79/98/99」等口径，官网定价页未见明示团队版价格 → 标注**需询价/需再确认**。
A4 口碑痛点（用户博客与反馈帖）：① 无批量导出，400 篇需逐篇手动导出；② 他人协作分享的文档无导出权限；③ 收藏文章无导出入口；④ 表格只能导出 xlsx、画板不能导出图片；⑤ 文档超 2000 字并含附件/卡片时，转阅读态加载 4–8 秒且部分内容空白；⑥ 导出 Markdown 格式有问题、不能批量导出导致无法用 Pandoc 二次转换；⑦ 网页端与客户端功能不统一、迭代慢。
喜爱点：目录树/大纲强、自动保存 + 历史版本、Markdown 与富文本混排手感好、中文体验与国内访问速度。

### Notion（notion.com）
A2 功能：blocks 模型，非原生 Markdown。支持 Markdown 快捷键书写、粘贴 Markdown 转 block、导入/导出 .md。导出格式：Markdown & CSV、HTML、PDF；整个 workspace 导出 PDF 的能力正在下线（逐步推送至 2026-08-31，之后仅保留单页 PDF）。导出 Markdown 的已知损耗：数据库变 CSV、内部链接变绝对 Notion URL（迁移即失效）、callout 变 blockquote、toggle 扁平化、列布局/同步块/评论丢失。（notion.com/help/export-your-content、back-up-your-data；wayofmarkdown、markdowntoolsonline 2026）
A3 定价（官网 pricing 2026-10-28 抓取）：Free $0 / Plus $10 per member/月（月付 $12）/ Business $20 per member/月 / Enterprise 定制。文件上传 Free 5MB/个，付费无限（单文件约 5GB 上限）。页面历史：Free 7 天 / Plus 30 天 / Business 90 天 / Enterprise 无限。Notion AI 早年 $10/seat 加购且需全 workspace 席位购买（vendorbenchmark 2026），2026 年结构已调整为随 Business 层捆绑。
A4 口碑：G2 4.6/5（13,836 条评测，2026-09 口径）；App MAU 8.20M（2026-06，AICPB）。好评集中：文档/wiki 一流、数据库灵活、界面美观。差评集中：学习曲线陡、大型 workspace 性能下降、移动端弱、自动化能力弱、AI 附加成本高、企业版报价不透明；安全侧有 PromptArmor 报告的 Notion AI 提示注入数据外泄问题。
A6 市场：官网 2026 宣称 100M+ 用户、50+ 国家、62% Fortune 100、G2 知识库类连续三年第一；ARR $600M（Forbes 2025-12）→ $865M（Sacra 2026-07）；估值 $11B（2026-01 员工 tender）。

### 品类共性痛点（交叉结论）
1. 在线 md 编辑器普遍**不支持 DOCX 导出**（StackEdit/Dillinger/HackMD/Notion 均无，仅语雀有 Word）。
2. **图片资产归属不透明**：StackEdit 需自建图床、Notion 导出后内部链接失效、公共图床易失效（图床跑路即图裂）。
3. **批量导出缺失**是国内外工具的高频吐槽点（语雀尤甚）。
4. 免费档普遍用**协作人数**卡脖子（HackMD 3 名队友、语雀 5 人、Notion Free 多人时 block 受限）。
5. 2026 年主流方向已全面转向 **AI workspace / AI agents**（Notion Agent、HackMD agent context layer），纯编辑器赛道在向"AI 可读的结构化内容层"演化。

