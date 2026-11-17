# README 维护指南

这份文档用于维护 `halavah/halavah` 的 GitHub 与 Gitee 展示内容。它记录已确认的内容、视觉与发布约定；以后维护时，以用户最新明确要求为准。

## 1. 展示目标

主页首先介绍 halavah，其次展示三个 Libra 产品，再展示两项其他实践。整体简洁、精致，以晨光小狮子插画、留白和清晰文字为主。

- 使用中文正文；分组标题可以配简短英文。
- 不添加项目截图、图片墙、密集技术徽章或 Stars 徽章，除非用户明确要求。
- 不把 README 做成整张长图；介绍、项目说明和链接保留为可搜索、可复制的 Markdown／语义 HTML。
- 不自行增加履历、成绩、技能熟练度、联系方式或“生产就绪”等宣传。

## 2. README 固定结构

按以下顺序组织：

1. “守着晨光的小狮子”4:1低横幅。
2. 左侧个人介绍、右侧办公照片，各占介绍区约一半；插画下方不另设身份标语。
3. `Libra · 开发工具`：Toolkit、Vue、Low。
4. `Projects · 更多实践`：Kiro Travel、Flare Plus。
5. 日常技术与分享介绍。
6. 默认展开、可折叠的 `GitHub 贡献` 区域。

不要重新添加重复的 `Hi, I'm halavah` 标题、兴趣尾注、英文座右铭或旧“全部仓库／Issues 交流”提示。

### 个人介绍

介绍区采用SVG图文素材：GitHub视口宽度大于700px时左侧介绍、右侧办公照片，700px及以下时先文字、后照片；Gitee固定左侧文字、右侧照片，手机沿用同一布局，不单独适配。GitHub的README使用#gh-light-mode-only与#gh-dark-mode-only显隐浅色、深色两个图组，每组picture只按700px视口宽度选择排列，默认回退为该主题桌面左右版；Gitee固定引用intro-desktop-light-wenkai.svg，电脑与手机均为左文右图，不使用被平台过滤的picture切换结构。两平台均不依赖自定义CSS或脚本。宽屏画布1200×470，手机版720×922，照片完整保留4:3比例。图片区整体宽度与顶部狮子横幅一致。

介绍文字在SVG图文中呈现，不再使用可复制的两列表格正文。完整原文同时保留在README图片alt及assets/profile/intro-text.json；修改时先更新JSON，执行node scripts/generate-profile-intro.mjs重新生成四份SVG，并同步更新README替代文字。SVG内嵌原办公照片，全部中英文以霞鹜文楷字形转为路径，不请求外部图片或字体，也不依赖访客本机字体。三个段落分别为性格、名字、收尾，姓名与正文统一使用文楷字形；原文字句与换行保留，不增加身份标语。两个平台各自核对宽屏、手机、深浅主题下的实际选择与图片加载，不把本地显示当作平台验收。

保持以下原文及姓名关系，不擅自改写事实：

> 我出生在天光初亮的时候，是个狮子座。心思细腻，做事认真；喜欢独处时的安静，也喜欢动手折腾的过程。网名 **troyekk**，源自 troyesivan；笔名 **halavah**，灵感来自 J.Fla 演唱的《Havana》。名字借来一点旋律，日子留给自己慢慢写。

README 可沿用 `<p>`、`<strong>`、`<span lang="en">` 等语义标记。顶部插画的替代文字应描述小狮子、笔记与晨光；不在图下或图片中额外添加身份标语，横幅后直接进入个人介绍。

### 图文艺术字与重建

图文介绍的全部中文、英文和标点采用霞鹜文楷常规字形，视觉内容转为SVG路径，避免平台过滤字体或访客缺少字体导致回退。字体源为assets/profile/wenkai-reading.woff2，SIL OFL 1.1许可及版权记录保存在同目录WenKai-OFL.txt。字体用于图形文档，不改写字体名称，不删除许可。

修改intro-text.json后，先执行`uv run --with fonttools --with brotli python scripts/extract-profile-glyphs.py`，再执行`node scripts/generate-profile-intro.mjs`。前一步检查缺字并生成intro-glyphs.json，后一步生成四份带-wenkai后缀的图文SVG；新增字符若不在字体子集中，必须补齐合法字形后重建，不静默替换为普通字体。字形尺寸统一等比适配列宽，不横向压扁，不改变指定换行。原文继续保留在JSON、README的alt及SVG描述，路径本身不作为可选择正文。

### 日常介绍

使用以下原文；未经指定，不给 X 或博客猜测链接：

> 日常使用 TypeScript、React、Electron、Python，在 X 与博客分享实测和构建记录。

这两段及职业定位属于用户明确提供的公开介绍，不是通过代码审查推断的履历。

## 3. 五个项目如何介绍

每个项目采用“可点击名称 — 一句用途说明”。三个 Libra 产品为主要分组，其他两个项目为次要分组。按以下顺序展示：

| 仓库 | 介绍基线 |
| --- | --- |
| `libra-spring-boot-starter-toolkit` | Java 8+ 工具集合，提供 SQL 数据访问、轻量 HTTP 与 Redis 集成。 |
| `libra-boot-vue` | 在浏览器加载 Vue 单文件组件，构建无需预打包的轻量页面。 |
| `libra-boot-low` | 通过 YAML 与 Jinja2 模板生成 Spring Boot、Vue、SQL 和接口示例。 |
| `kiro-travel` | 基于 Next.js 与 SQLite 的旅游服务平台，覆盖景点、门票与酒店等业务。 |
| `flare-plus` | Cloudflare API 测试与学习项目，整理常用服务的示例与资料。 |

更新能力描述前，先读对应仓库的当前 README 与相关实现。不要把源码检查说成完整运行验证，不把三个 Libra 项目写成已验证可无缝集成的一体化平台，也不把生成代码写成可直接投产的应用。

## 4. 图片与主题适配

视觉素材放在根目录的 `assets/profile/`，使用相对路径引用。

| 文件 | 用途 |
| --- | --- |
| `intro-text.json` | 图文介绍的文字事实源，保留三个段落与指定换行 |
| `intro-desktop-light-wenkai.svg` / `intro-desktop-dark-wenkai.svg` | 宽屏左文右图，1200×470 |
| `intro-mobile-light-wenkai.svg` / `intro-mobile-dark-wenkai.svg` | 手机上文下图，720×922 |
| `lion-dawn-wide.webp` | 顶部晨光小狮子插画，1536×384，深浅背景均使用完整画面 |
| `hero-light.svg` / `hero-dark.svg` | 未被当前README引用的字符素材 |
| `hero-light-mobile.svg` / `hero-dark-mobile.svg` | 未被当前README引用的手机字符素材 |
| `github-contribution-grid-snake.svg` / `github-contribution-grid-snake-dark.svg` | 浅色／暗色贡献贪吃蛇动画 |
| `contributions-static.svg` / `contributions-static-dark.svg` | 备用静态贡献快照 |

顶部插画保留完整4:1横幅画面，以低窗景重新构图，不拉伸主体或直接裁掉狮子；使用本仓库相对路径，不依赖外部图片服务。WebP文件不包含个人凭据或原始生成元数据，替换后检查电脑、手机和深浅背景下是否清晰。旧字符素材当前不参与展示，不在维护时自动删除。

顶部插画不按主题替换，两平台均使用同一幅画；贡献图继续通过`<picture>`选择深浅素材。平台控制README图片的响应缩放，不添加依赖自定义CSS的布局。不要假定本地预览等于平台渲染，需检查GitHub和Gitee实际显示。

## 5. 贡献动画的边界

- 动画基于 **halavah 的真实 GitHub 贡献数据快照**，不是 Gitee 贡献数据，也不是实时热力图。
- 仅展示生成时的当前自然年：按 `Asia/Shanghai` 从当年 1 月 1 日到当天；显式排除前一年与未来日期，不使用滚动最近 365 天。年份、查询边界、README 标题与替代文字由脚本自动计算；2027 年首次定时任务会切换到 2027，不用手改。
- 文件内自带动画，可循环播放；数据由每日工作流生成当年的最新快照，不是浏览器内实时取数。
- 动画文件直接保存在 `master`，不要重建 `output` 分支。经用户授权，现由 GitHub Actions 每天北京时间 10:23 更新，；支持手动触发。Gitee 不再自动同步。
- 深浅主题都默认引用动画。此前自动按 `prefers-reduced-motion` 切换静态图造成了静态展示疑问，不未经用户确认恢复这一规则；静态文件仅作备用。
- 更新数据必须重新获取真实贡献日历并生成对应动画；不要用随机格子、复制他人贡献图或只改文件日期冒充更新。
- 修改配色时同步深浅动画及静态备用图，保留动画关键帧与生成器归属说明。当前使用青紫霓虹配色。
- 若页面不动，先检查实际选中的图片 URL、主题选择、是否引用静态图、SVG 动画、平台动画设置与缓存，不直接认定是某一原因。

### 自动更新实现与维护

- `.github/workflows/contributions.yml` 每天北京时间 10:23 更新 GitHub 当前自然年的贡献图，也支持手动触发。
- `.github/scripts/contribution-period.mjs` 计算北京时间年份、日期边界与 README 局部更新；`update-contributions.mjs` 获取真实 GitHub 贡献日历并生成图片。
- 到下一年，首次任务自动改为当年 1 月 1 日至当天，更新标题、替代文字、深浅动画与静态备用图，无需手改年份。
- 生成依赖固定为 `generate-snake-animation@3.5.0`，使用 lockfile 与 `npm ci --ignore-scripts --omit=optional`，不提交 `node_modules`。
- API 只使用 GitHub 自动提供的 `GITHUB_TOKEN`；不需要个人 Token，也不保存 Gitee 同步凭据。
- 每次更新保留一个根提交，使用带预期 SHA 的 `--force-with-lease`；发现并发修改或提交数改变时中止。
- `assets/profile/contributions-state.json` 记录数据来源、年份、起止日期与汇总，不含凭据。
- 运行 `node --test .github/scripts/contribution-period.test.mjs` 验证跨年、闰年、日期过滤和文案更新。
- 用户已取消 Gitee 自动同步：保留 Gitee 现有版本，不声称其后续数据会自动更新。需要再同步时，另行取得明确授权。
- GitHub 定时任务可能延迟；公开仓库长期没有活动时平台可能停用调度，届时检查 Actions 并恢复或手动运行。

## 6. GitHub 与 Gitee 的差异

- GitHub 项目入口使用 `https://github.com/halavah/<仓库名>`。
- Gitee 项目入口使用 `https://gitee.com/halavah/<仓库名>`。
- 两边内容与视觉保持一致；不要盲目覆盖平台专属链接或独有修改。
- GitHub 同名公开仓库 README 可展示在账号主页。
- Gitee 目前已验证的是仓库首页 README；不承诺同名 README 自动出现在账号概览。
- Gitee 账号页通过个人简介、公开主页链接和六个精选项目提供入口。六项为五个产品／实践仓库及 `halavah` 展示仓库。
- 仓库 README 的修改不会自动修改账号简介、主页链接或精选项目；这些设置需要单独维护。

### 双平台源码一致性

GitHub与Gitee共用活动源码、生成器、字体许可、静态素材、文档及旧站归档。仅README保留平台项目链接与布局差异：GitHub自适应，Gitee固定左右。对齐源码时不覆盖这些已确认的README差异；其他跟踪文件应逐字一致。

Gitee旧Hexo根目录文件统一进入assets/halavah-legacy-backup-20261118，保留内容并核对SHA256.json。旧同步脚本保留为归档资料，不被当前工作流执行；复制工作流源码不等于在Gitee启用GitHub Actions，也不创建新的自动同步授权。推送前分别核对远端与单根提交，使用带预期SHA的force-with-lease。

## 7. 隐私与仓库范围

- 不提交 Token、密码、私钥、数据库凭据、私人环境文件、个人本机路径或未经确认的个人资料。
- 本仓库已清理博客文档、生成 HTML 和 `db.json` 中的密码样式原值，统一使用 `YOUR_DATABASE_PASSWORD`。不要从旧备份或生成缓存重新带回原值。
- 示例配置使用明确占位值；不能因为服务地址是 localhost 就认定密码无敏感性。
- 凭据只通过授权的运行时凭据机制使用，不放进远端 URL、指南、脚本、提交信息或日志。
- 保留第三方版权与许可说明，不把第三方作者邮箱误当成本人泄露信息而删除。
- 旧站可公开文件保存在 `assets/halavah-legacy-backup-20261118/` 并纳入Git；提交前检查敏感信息。Git bundle和旧历史备份继续仅本地保存，不推送。
- `docs/index.html` 是独立个人主页，`docs/assets/personal/` 保存该页样式、原办公照片、Poppins字体与许可；普通README或贡献图维护不修改这些文件。旧Hexo源码、主题、文章、配置及发布文件保存在 `assets/halavah-legacy-backup-20261118/`，纳入Git但不属于Pages发布内容。

## 8. 独立个人主页

- 浏览器标签栏标题为“一屏只留一件事”，正文标题仍为个人问候语。标签图标是深色圆角方底、浅色屏幕轮廓与单道琉璃横线，文件docs/assets/personal/favicon.svg；不使用字体绘制，保证小尺寸辨识。图标链接附内容指纹，替换时同步更新。
- 正式个人网站地址为 `https://halavah.us/`，由独立仓库 `halavah/halavah.github.io` 的 `master` 分支 `/docs` 发布。本仓库仍保留 `/docs` 页面副本和原项目地址 `https://halavah.github.io/halavah/`，规范地址指向短地址。网站后续修改应先在独立网站仓库完成，再同步本仓库副本。这是独立静态页面，不嵌套北窗、不请求其后端。
- 内容以北窗“关于我”的办公照片、三段自我介绍及原始手写签名为依据。去除作品窗口介绍段，正文不含简历或社交入口引导，不虚构个人资料。
- 页面使用深色底，正文为本地霞鹜文楷常规字重网页子集，其他文字保留Poppins与系统字体。电脑和手机均为单列，顺序为完整4:3照片、问候语、三段正文、签名。正文最大620px，17px字号、约30px行高、20px段距，左对齐，不额外拉大字间距。电脑照片宽330～390px，手机完整显示、左右24px。优先阅读舒适，短屏与文字放大时自然滚动，不裁切或缩小正文。文楷字体文件为wenkai-reading.woff2，许可WenKai-OFL.txt保留；来自官方lxgw/LxgwWenKai常规字重，子集覆盖当前标题、正文和基本ASCII，改文案时重新检查覆盖。正文后靠右为TroyeKK签名，手机上随正文排列，不固定悬浮。原始签名入场书写一次，随后叠加每2秒循环的整笔琉璃亮光与少量星点；不显示控制文字，点击签名可暂停或继续，系统减少动态效果时保留完整静态笔迹。
- 正文底部左端为GitHub主页图标，右端为手写签名，与正文左右边界对应；仅有一个GitHub入口，链接https://github.com/halavah，新标签页打开，点击区域44px，提供无障碍名称与键盘焦点。不包含简历、管理、其他社交图标或访问授权交互，不把其脚本、私有内容或凭据复制到页面。GitHub资料README和贡献动画继续独立维护。
- 图片、CSS、字体与图标均使用相对路径，保证 `/halavah/` 项目子路径可用。`docs/.nojekyll`使页面按静态文件发布。本仓库副本不设置CNAME；独立网站仓库的docs/CNAME绑定halavah.us，由Cloudflare仅DNS解析到GitHub Pages，并由GitHub提供HTTPS。
- `npm run build` 或 `npm run check:page`只运行 `node scripts/check-personal-page.mjs`，核验页面和本地资源，无需安装Hexo依赖。根包不声明Hexo运行依赖，也不提供旧生成、清理或部署命令；旧博客目录和配置只在根目录assets下归档，不作为个人页构建入口。贡献动画在.github/scripts中独立维护，不受根包简化影响。
- 本地预览可执行 `python3 -m http.server 18885 --bind 127.0.0.1 --directory docs`，再打开 `http://127.0.0.1:18885/`。发布前还应在 `/halavah/` 子路径核对资源，检查桌面、手机和文字放大；照片与字体必须成功加载。
- 修改页面后按本指南的单根提交与明确SHA租约维护约定推送；等待GitHub Pages构建成功，并核对发布提交及实际网址。发布目录只保留新个人页及其资源；旧博客文章和旧站资源在assets下归档，不作为Pages网页发布，但可以在Git仓库中阅读。

### 旧站归档边界

- 旧站归档路径为 `assets/halavah-legacy-backup-20261118/`，随仓库推送；Pages只发布根目录 `/docs`，不发布归档，也不建立 `/about/` 入口。
- 归档保存旧Hexo源码、主题、文章、配置、依赖清单、发布文件；旧首页及 CNAME 来自替换个人页前的提交。旧依赖清单和锁文件封存于 `legacy-node-dependencies.zip`，复制旧站备份到独立目录后可用 `unzip -n legacy-node-dependencies.zip` 恢复原路径。`SHA256.json`记录除自身之外的归档文件校验值。迁移前Git bundle继续留在仓库外同名本地目录，`.gitignore`排除所有bundle文件。
- 当前根目录仅维护个人页检查脚本、包配置、GitHub资料README和贡献动画；旧生成与部署脚本不再保留为活动入口。
- 恢复旧站须在独立工程进行，先审查依赖和公开内容，不能直接把旧归档覆盖当前发布目录。

## 9. 每次维护与发布流程

1. 检查工作区、远端默认分支和最新提交，先比较两端差异，不覆盖他人或用户的新改动。
2. 修改前在仓库外保存可恢复备份；敏感备份不公开。
3. 将变更限制在本次要求范围，通常是 README、展示素材或本指南。
4. 检查文案事实、平台链接、图片路径、SVG XML 和 Markdown 格式，执行 `git diff --check`。
5. 素材改变后实际渲染检查桌面／手机、深浅主题；动画改变后比较不同时间的画面。
6. 仅在用户授权发布后推送。若用户只要方案或只读检查，停在对应阶段。
7. 两个 `halavah` 展示仓库的默认分支均保持 **一个根提交**：使用 amend 合并维护，不增加提交链。
8. 提交作者与提交者使用 `halavah` 和 `55541070+halavah@users.noreply.github.com`，避免加入私人邮箱。
9. 改写远端前重新核实当前 SHA，使用指定预期 SHA 的 `--force-with-lease`；不使用无保护的强推，不推送所有本地 refs。
10. 推送后确认默认分支仍只有一个提交、没有误建 `output` 或旧标签，核对远端文件及实际展示。
11. 最后简要报告修改、验证、提交标识和未完成事项，不把“未发现”写成“绝对不存在”。

单提交是当前仓库维护约定，不等于能删除平台缓存、旧提交访问入口或他人副本；真实凭据若曾泄露，仍需撤销或轮换。未经明确授权，不清除其他项目历史。
