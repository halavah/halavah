# 域名与HTTPS配置指南

把Cloudflare管理的自有域名绑定到GitHub Pages，让访问者使用自己的域名浏览静态网站。本文采用根域名作为主地址，www自动跳转到主地址；Cloudflare只提供DNS解析，GitHub负责网站托管、证书申请、部署和正常情况下的自动续期。本文覆盖首次配置、强制HTTPS、日常维护及故障恢复。

全文为脱敏示例，不记录实际账户或部署状态。`example.com`替换为你拥有的域名，`YOUR_USERNAME`替换为GitHub用户名，`YOUR_REPOSITORY`替换为实际发布网站的仓库名；不要把这些示例直接当作可用配置。官方公共服务器IP无需脱敏。

## 使用范围与处理顺序

```text
域名仍有效 → 名称服务器正确 → 所有权验证 → Pages绑定 → DNS指向
→ 证书签发并生效 → Enforce HTTPS → 真实跳转及资源验收 → 日常续期检查
```

| 你要处理什么 | 本文入口与完成条件 |
| --- | --- |
| 首次绑定网站 | 第1～4节完成准备、验证、托管绑定与解析 |
| HTTP正常但显示不安全 | 第5节区分状态，第6.5节启用强制跳转；第7节实测 |
| HTTPS证书错误或没有签发 | 第6.1～6.4节按协议、DNS、绑定、签发链路查因 |
| 只有某个浏览器有旧提示 | 服务器检查正常后，按第6.6节处理本地例外或缓存 |
| 到期日临近、担心自动续期 | 第8节区分注册续费、托管续期和监控，按异常流程恢复 |
| 更换托管或停用域名 | 第10节回退，避免遗留指向无绑定站点的记录 |

本文是操作指南，不是某个域名的上线收据。配置保存、构建成功、证书批准、强制跳转开启和实际访问通过都必须分别确认。默认只调整目标网站记录，不清空邮箱或其他业务配置。

## 1. 准备条件

- 已拥有域名，并能管理注册商的名称服务器设置。
- 域名已加入Cloudflare，注册商使用该域名在Cloudflare获分配的名称服务器，区域状态为Active。不要照抄别人的名称服务器。
- GitHub仓库已开启Pages，默认网址能正常显示网站，CSS、图片和字体均正常。
- 有仓库管理权限。使用账户根网址时，仓库名为`YOUR_USERNAME.github.io`；其他仓库属于项目站点，自定义域名同样可绑定。
- 本文以master分支的`/docs`目录为发布源。若实际使用其他分支或根目录，应将后续文件位置改为实际发布根目录。

修改前导出现有DNS记录并私下保存。确认根域名和www是否已有网站；若已有，先明确替换目标。保留邮箱MX、SPF、DKIM、DMARC以及其他子域名记录，不批量清空区域。备份可能包含内部信息，不上传公开仓库。

## 2. 验证域名所有权

先在GitHub个人账户的Settings → Pages中添加域名。这里是账户设置，不是仓库设置。

1. 输入`example.com`，取得GitHub给出的TXT记录名称和值。
2. 在Cloudflare对应域名的DNS → Records中添加TXT记录。名称使用GitHub要求的主机名；若输入框自动补全域名，核对最终名称，避免重复后缀。值原样填写，不添加额外引号。
3. 等待记录可查询后，在GitHub点击验证。
4. 验证成功后保留TXT记录，以维持所有权保护。

TXT名称和值由当前账户生成，本文不提供真实值，也不需要API密钥。不要用通配符解析代替验证记录。

## 3. 配置GitHub Pages

在仓库Settings → Pages中确认：

| 项目 | 本文示例 |
| --- | --- |
| 构建方式 | Deploy from a branch |
| 分支 | master |
| 发布目录 | /docs |
| Custom domain | example.com |

先在GitHub保存自定义域名，再添加指向GitHub的DNS记录，减少域名处于未绑定状态的风险。

从分支发布时，发布根目录应有名为`CNAME`的纯文本文件。本例路径为`docs/CNAME`，内容只有一行：

```text
example.com
```

不写协议、路径或多个域名。本文以根域名为主地址，所以文件不写www；若另选www作为主站，须对应调整Pages主域名与CNAME，不能混用。若GitHub保存设置时自动生成提交，先同步远端，避免后续推送覆盖该文件。静态生成器也必须保留它。

如果使用自定义GitHub Actions发布，CNAME文件不控制域名；应在Pages设置中配置，并确认上传的站点产物正确。本文后续仍按分支发布方式操作。

### 3.1 用户站点、项目站点和路径

`YOUR_USERNAME.github.io`同名仓库对应用户站点，其他仓库通常对应项目站点。用户站点使用自定义域名后，未单独绑定域名的项目站点通常沿用该域名，并保留`/YOUR_REPOSITORY/`路径；不要据此把每个项目都设置成根网址。

同一主域名只在负责根网站的仓库绑定。保存页面副本的项目仓库不重复添加同一CNAME；项目页面中的图片、字体、CSS和图标使用能适应项目子路径的相对路径。HTML中的canonical是声明首选网址，不是HTTP重定向，也不能代替DNS、Pages绑定或证书配置。

### 3.2 留存配置与验收结果

每次配置验收的操作记录应分别包含发布源、绑定域名、目标部署提交、证书状态、实际证书有效期、https_enforced值及HTTP/HTTPS请求结果。每项记录读取时间；没有检查的项目标为未核验，不通过证书approved推断强制跳转已启用，也不通过构建成功推断实际网页正常。

本教程保留为可复用的脱敏配置说明，不存放真实账户ID、验证TXT值、访问凭据或实际DNS导出。证书到期日是运行状态，不写成固定设计参数；续期后以实际服务的新证书为准。

## 4. 配置Cloudflare DNS

在对应域名的DNS → Records中新增以下记录：

| 类型 | 名称 | 内容 | 代理状态 | TTL |
| --- | --- | --- | --- | --- |
| A | @ | 185.199.108.153 | DNS only | Auto |
| A | @ | 185.199.109.153 | DNS only | Auto |
| A | @ | 185.199.110.153 | DNS only | Auto |
| A | @ | 185.199.111.153 | DNS only | Auto |
| CNAME | www | YOUR_USERNAME.github.io | DNS only | Auto |

`@`代表根域名；DNS only是灰云，不是橙云代理。CNAME目标不带协议、路径或仓库名。本文不启用Cloudflare反向代理，也不需要改动整个区域的SSL模式或建立转发规则。

如有同名旧A、AAAA或CNAME指向其他网站，先确认依赖，再替换冲突的网站记录；邮箱MX和TXT不因名称相同而需要删除。不要增加`*`通配符记录。

IPv6是可选项。需要时可在保留上述IPv4记录的同时新增：

| 类型 | 名称 | 内容 | 代理状态 |
| --- | --- | --- | --- |
| AAAA | @ | 2606:50c0:8000::153 | DNS only |
| AAAA | @ | 2606:50c0:8001::153 | DNS only |
| AAAA | @ | 2606:50c0:8002::153 | DNS only |
| AAAA | @ | 2606:50c0:8003::153 | DNS only |

## 5. 分清证书、HTTPS和强制跳转

“强制SSL证书”通常混合了两个目标：先取得有效的TLS证书，使HTTPS可用；再启用HTTP到HTTPS的强制跳转。TLS是当前HTTPS使用的加密协议，SSL是常见旧称。

| 状态 | 能证明什么 | 下一步 |
| --- | --- | --- |
| DNS正确 | 域名指向目标服务器 | 检查Pages域名绑定与证书申请 |
| Pages构建成功 | 网站文件已发布 | 检查实际域名和HTTPS，不代表证书已签发 |
| 证书已签发 | 域名可使用有效证书建立HTTPS连接 | 实测HTTPS，再开启Enforce HTTPS |
| HTTP仍返回200 | HTTP页面仍可直接访问 | 检查强制HTTPS开关，不必因此重签证书 |
| HTTP跳转HTTPS，证书校验通过 | 加密访问和强制跳转均正常 | 验证www及页面资源 |

本文使用DNS only，访客直接连接GitHub。应在**GitHub仓库Settings → Pages → Enforce HTTPS**开启强制跳转。Cloudflare的Always Use HTTPS只作用于经过其代理的HTTP请求；灰云DNS only流量不会经过该功能。不要靠切换Cloudflare全局SSL模式解决直连GitHub的问题。

Cloudflare边缘证书、GitHub托管证书和Cloudflare Origin CA证书用途不同；不用向Git仓库上传私钥或手工证书。GitHub Pages负责申请和部署其托管证书。

## 6. 按顺序排查未生效

### 6.1 先确认实际访问协议

把地址栏复制出来检查协议，分别访问`http://example.com/`与`https://example.com/`。浏览器可能隐藏协议，不能只看域名判断是否加密。

- HTTPS正常、HTTP仍提示“不安全”：优先检查强制跳转。
- HTTPS出现证书错误：检查证书覆盖域名、有效期、信任链及域名解析。
- HTTPS连接正常但页面有资源警告：检查混合内容。
- 全屏“危险网站”警告属于另一类问题，不能用证书有效来证明网站没有安全风险。

### 6.2 核对DNS和名称服务器

在macOS或Linux终端执行：

```bash
dig +short NS example.com
dig +short A example.com
dig +short AAAA example.com
dig +short CNAME www.example.com
dig +short CAA example.com
dig @1.1.1.1 +short A example.com
dig @8.8.8.8 +short A example.com
```

Windows PowerShell可用`Resolve-DnsName example.com -Type A`及`Resolve-DnsName www.example.com -Type CNAME`。

根域名A记录应对应本文四条GitHub地址，www应指向`YOUR_USERNAME.github.io`。没有配置IPv6时AAAA可以为空；若存在旧AAAA，则部分设备可能连到错误服务器。核对Cloudflare分配的名称服务器与注册商设置一致。

比较多个递归DNS节点，并在需要时向实际权威名称服务器查询；旧结果和“没有记录”的结果都可能被缓存。官方提示DNS传播可能需要24小时。若出现SERVFAIL等解析失败，继续检查DNSSEC及注册商的DS记录是否与当前DNS服务匹配，不盲目关闭DNSSEC。

若设置了限制证书颁发机构的CAA记录，应允许GitHub使用的Let’s Encrypt，授权值为`letsencrypt.org`；没有CAA记录不等于禁止签发，不为排障随意增加限制。

### 6.3 核对发布源、绑定和CNAME

检查仓库Settings → Pages的分支、目录和Custom domain。

- 发布`/docs`时，网页入口是`docs/index.html`，域名文件是`docs/CNAME`。
- 发布仓库根目录时，入口和CNAME才位于仓库根目录。
- CNAME文件只写主域名`example.com`，不含协议、路径和多个域名。
- 不要在根目录与docs中重复放置不同CNAME来碰运气；文件存在也不能代替Pages设置中的域名绑定。
- 查看最近一次构建与部署是否对应目标提交，不能只检查本地文件。

通过GitHub CLI读取状态时，先将下面两个占位参数替换为自己的用户名和仓库名。需要已安装并登录GitHub CLI；读取无需把任何凭据写进命令：

```bash
gh api repos/YOUR_USERNAME/YOUR_REPOSITORY/pages \
  --jq '{cname,source,status,https_certificate,https_enforced}'
```

`cname`应为主域名；`source`应匹配发布源；`https_certificate`可用于辅助判断签发状态，`https_enforced`是独立的强制HTTPS开关。不同阶段可能没有完整证书字段，最终还要实测连接。

### 6.4 证书不存在或一直申请中

先检查DNS、代理状态、域名绑定、CAA和构建错误。GitHub会在域名设置后进行DNS检查，再申请和部署证书；保存设置成功不等于证书已经存在。

确认配置正确且签发持续未完成时，按GitHub官方流程重新触发：

1. 保存当前域名设置、DNS记录及CNAME文件信息，优先完成账户层的域名所有权验证。
2. 在仓库Pages设置中移除自定义域名，再立即重新填入同一主域名并保存。
3. 保持正确DNS不变，确认域名已重新绑定；不要让它长期处于DNS仍指向GitHub而仓库未绑定的状态。
4. 检查是否产生CNAME变更提交，并同步本地；确认构建部署正常，等待新的检查和签发结果。
5. 若仍失败，记录GitHub给出的具体错误并继续查因，不高频反复移除重加，也不把每次重试都说成“已修复”。

这项操作可能短暂影响自定义域名访问，应在可接受的窗口执行。若证书已批准且实际HTTPS正常，直接进入强制跳转检查，不再重启签发流程。

### 6.5 证书有效但HTTP仍显示“不安全”

先确认`https://example.com/`能正常访问且证书校验通过，再在仓库Settings → Pages勾选**Enforce HTTPS**。启用后，HTTP请求应跳转到HTTPS，而不是直接返回正文。

已登录GitHub CLI且有仓库管理权限时，也可使用以下**写入命令**，只在确实要启用时执行：

```bash
gh api --method PUT repos/YOUR_USERNAME/YOUR_REPOSITORY/pages \
  -F https_enforced=true
```

如果返回“证书不存在”等错误，说明尚不能开启，应回到证书排查，不将失败当成成功。不要为修复HTTP提示而关闭浏览器安全功能或忽略证书错误。

### 6.6 浏览器仍保留旧提示

服务器侧验证正常后，再排查浏览器：

1. 手动输入完整的`https://example.com/`，核对最终地址和站点连接信息。
2. 如站点信息中显示“已关闭安全警告”并提供“开启警告”，恢复警告；此项是浏览器本地设置，不是服务器证书状态。
3. 关闭旧标签页后重新打开，用另一浏览器或无痕窗口比较，区分缓存、扩展及站点设置问题。
4. 检查设备日期时间、网络代理或安全软件是否影响证书校验。只有一台设备异常时，先比较其他设备和网络。
5. 必要时只清除此站点相关数据；先了解会退出登录等影响，不默认清空全部浏览历史、Cookie或全局权限。

不同浏览器的图标和设置名称不同，不要求必须显示旧式“锁”图标；以连接信息、有效证书和实际协议为准。恢复警告不会替服务器签发证书，也不会自行开启HTTP跳转。

### 6.7 页面资源与跳转循环

检查浏览器Console及Network：图片、CSS、字体、脚本和请求地址不能仍使用不安全HTTP。站内资源采用正确相对路径或HTTPS，canonical主地址统一为`https://example.com/`。

若发生循环跳转，检查主域名归一规则，以及是否意外开启Cloudflare代理和额外重定向。本文的DNS only模式不需要Cloudflare转发规则；若改用代理，应单独设计两段TLS和回源设置，不用Flexible模式规避源站证书问题。

若显示README或404，先修发布目录、网页入口、Pages绑定和部署状态，而不是反复申请证书。若邮箱异常，只对照备份检查邮件记录，不通过删除MX/TXT来修网站。

## 7. 验收：看状态，也看实际连接

先检查每一跳，再检查最终页面：

```bash
curl -I http://example.com/
curl -I https://example.com/
curl -I https://www.example.com/
curl -IL --max-redirs 5 http://www.example.com/
curl -fsS -o /dev/null -w '%{http_code} %{url_effective}\n' https://example.com/
```

预期结果：

| 检查 | 通过标准 |
| --- | --- |
| HTTP主地址 | 返回重定向，Location指向HTTPS，不直接返回HTTP正文 |
| HTTPS主地址 | 默认校验证书成功，最终网页正常返回 |
| www地址 | 归一到HTTPS根域名，跳转次数有限，无循环 |
| Pages状态 | 域名正确、目标构建部署成功、https_enforced为true |
| 实际页面 | 电脑和手机均正常，图片字体无证书或混合内容错误 |
| 其他业务 | 邮箱、其他子域名未被误改，所有权验证TXT保留 |

curl不能加`-k`或`--insecure`跳过证书验证。单个200、一次DNS查询、一个approved字段或一张截图，均不能单独代表整条链路通过。若使用代理网络，还应比较正常浏览器或另一网络的结果。

公开操作记录使用示例域名和参数，不上传Token、API密钥、Cookie、私钥、账户ID、真实验证值或私人DNS备份。只有全部验收通过，才可宣告HTTPS配置完成。

## 8. 证书自动续期与日常维护

### 8.1 三件事分别由谁负责

| 事项 | 负责方 | 如何保持有效 |
| --- | --- | --- |
| 域名注册续费 | 域名持有人与注册商 | 确认到期日、自动续费和付款方式，处理注册商通知 |
| Pages托管证书续期 | GitHub | 保持域名验证条件、DNS和Pages绑定正确，由平台申请并部署后续证书 |
| 强制HTTPS | 网站维护者配置，GitHub执行 | 证书有效后开启Enforce HTTPS，核验HTTP跳转 |

域名注册和DNS托管可能由不同服务商提供；域名放在Cloudflare管理解析，不代表注册费也由Cloudflare收取。证书免费自动续期也不会替你续费域名。

GitHub Pages正常会在证书过期前自动续签和替换证书，新的证书具有新的有效期。看到当前证书的到期日，不代表必须在那一天手动换证书；也不代表域名到期日相同。不需要自行安装Certbot、编写续签任务、购买证书或向仓库上传私钥。

自动续期依赖平台及域名验证链路正常，不是绝不会失败的保证。不能将普通文件推送、amend或每天重建页面视为证书续期命令；不要用这样的操作代替故障排查。Enforce HTTPS负责跳转，不是“自动续期”开关，开启它也不能挽救已经失效的证书。

### 8.2 保持续期条件

- 域名注册仍有效、未暂停，注册商联系方式与付款方式可用。
- 名称服务器和DNSSEC配置有效，根域名与www仍指向正确的GitHub Pages目标。
- 本文模式下继续保持DNS only，不在证书签发后直接切回橙云代理；改变代理架构时，应重新验证签发与续期链路。
- GitHub Pages仍启用，仓库中的域名绑定、发布源和分支发布所需CNAME没有被删除或覆盖。
- 若有CAA限制，允许GitHub所用的Let’s Encrypt；所有权验证TXT继续保留。所有权验证有助于保护绑定，但不等同于证书一定能续签。
- 修改仓库归属、用户名、发布源、DNS服务商或网站主域名后，重新验收解析、证书和跳转。

### 8.3 如何检查到期与替换结果

先使用`curl -I https://example.com/`验证正常证书校验，再查看浏览器证书信息中的有效期和覆盖域名。到期日属于当前正在提供服务的证书，后续可能随自动换证更新，不把具体日期写死在运维规则里。

需要命令行查看证书日期时，可在有OpenSSL的环境执行：

```bash
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -dates
```

此命令仅展示连接拿到的证书日期，不能替代curl对证书信任与主机名的验证；连接或证书读取失败时也不能据此判为“没有过期”。根域名和www都要检查，不能假定两者状态永远相同。

可将“定期检查剩余有效期、进入提前告警窗口时通知维护者”加入自己的监控，例如每周检查、剩余不足30天时提醒。这是建议的告警策略，不是GitHub承诺的固定续签时间；本文不创建监控或定时任务。短有效期证书或平台策略变化时，应调整阈值。

发现有效期尚未更新时，先看剩余时间、DNS和GitHub证书状态；不要单凭日期不变立即重置正常绑定。临近到期仍未更换时，应主动排查，而非等到过期当天。

### 8.4 自动续期失败或证书已过期

1. 确认设备时间正确，并用另一网络或设备比较，排除本机时间与代理干扰；不要跳过证书校验。
2. 检查域名是否已续费、被暂停或更换名称服务器。注册失效时先在注册商恢复域名，再检查DNS。
3. 依次核对根域名、www、旧AAAA、代理状态、CAA及DNSSEC，修复与当前托管不一致的配置。
4. 检查GitHub Pages是否启用、域名绑定是否正确、CNAME是否被生成器覆盖，并读取证书错误。已签发但线上仍提供旧证书时，比较实际响应和平台状态。
5. 只有配置已正确而申请仍卡住时，才在可接受的维护窗口按本文的移除后重新添加流程触发签发，避免高频重置。若平台持续报错，保留脱敏后的错误信息并联系GitHub支持，不公开账户凭据或私有DNS备份。
6. 新证书部署后，验证根域名与www的有效期、覆盖域名和完整HTTPS连接，再确认Enforce HTTPS开启、HTTP正确跳转、页面资源正常。

证书过期时即使HTTP还能访问，也不能将它当作等价修复。不要让访客关闭安全警告、使用忽略证书错误的参数或通过HTTP提交敏感内容。只有新证书和整条访问链路均通过验收，才能宣布恢复。

## 9. 源码同步与展示问题的隔离

### 9.1 区分三个公开位置

仓库根README由GitHub或Gitee渲染；Pages只发布选定目录；自定义域名绑定到指定的GitHub Pages站点。本文选择/docs，因此根assets目录中的README素材不会自动出现在自定义域名下的/assets路径。需要作为网页资源发布时，应明确放入发布目录并更新网页引用。

README使用仓库相对路径，例如assets/profile/lion-dawn-wide.webp；网页使用相对发布根的路径，例如./assets/personal/workspace.webp。复制仓库源码到另一个平台不等于自动启用Pages或取得证书。主域名只绑定负责正式网站的仓库，保存源码副本的仓库不重复绑定同一域名。

双库同步先核对跟踪文件树、文件内容和平台专属README。源码、许可、生成工具和文档可以相同，但项目链接与图片选择规则按已确定的平台能力分别维护。Git记录中的提交SHA不同不表示文件不同；推送前核对实际远端SHA并使用带明确租约的更新方式，不盲目覆盖并发修改。私有配置、Git bundle和DNS导出不随源码公开。

### 9.2 按现象选择排查链路

| 现象 | 优先核对 | 不应由此推断 |
| --- | --- | --- |
| README仍显示旧图 | 当前分支文件、引用地址、实际图片尺寸、平台缓存 | DNS或TLS一定有问题 |
| 手机布局不切换 | 平台保留的picture/source、视口宽度、media条件、currentSrc | 手机操作系统名能直接决定素材 |
| 艺术字回退 | 是否仍引用依赖系统字体的text或旧素材 | 需要重签证书或关闭浏览器保护 |
| 自定义域名资源404 | Pages发布根、相对路径、目标构建和产物 | 仓库里存在文件就一定已部署 |
| HTTPS正常而HTTP不跳转 | Enforce HTTPS及每一跳的Location | 证书必须重新签发 |

图片缓存问题先确认两个平台各自推送到目标分支，再检查实际响应的原始尺寸与显示比例。压低HTML的height不能替代正确图片比例；追加查询参数也不能保证平台缓存刷新。必要时采用新文件名并更新引用，实际查看新图后再完成验收，不要求清空全部浏览数据。

平台会过滤部分HTML。排查时同时核对currentSrc及默认img的src：source未被采用时，默认图也必须是桌面左右版，避免电脑端降级为手机上下图。正常介绍图在GitHub按700px视口分界选择桌面或手机素材，并匹配深浅主题；Gitee固定直接引用桌面浅色图文，手机不另做排列。平台选择规则不同不属于证书故障，不通过修改DNS或开启代理来修复。

当前文楷介绍图的视觉字形已转成SVG路径，文件名带-wenkai后缀，不请求外部字体。原文保留于文字JSON、README的alt和SVG描述；维护时核对缺字、路径素材与替代说明。图片能显示不等于字体或辅助阅读已验收，但不应为字体问题放宽TLS校验。

GitHub主题排障必须把站内手动设置与浏览器系统偏好分开。已复现的故障条件是：站内Dark default将手机暗色source的复合media条件改写为同时匹配light与dark，原有宽度条件丢失，导致1920px宽屏选中手机上下图。单纯修改默认img回退不能防止这个仍被选中的source。

当前结构使用两个独立主题图组：外层链接分别以#gh-light-mode-only和#gh-dark-mode-only结尾，GitHub负责显隐；组内source只包含(max-width: 700px)，img为该主题桌面版回退。这样主题选择不参与屏宽条件改写。该结构依赖GitHub当前主题样式，应在平台变化后重新验收，不当作所有Markdown平台都支持的HTML标准能力。

按以下顺序核验，不修改DNS或证书：

1. 记录使用者原来的GitHub主题设置；在站内实际选择Light default，等待保存，打开并刷新个人主页。
2. 在大于700px的视口确认只显示intro-desktop-light-wenkai.svg，700px及以下确认只显示intro-mobile-light-wenkai.svg。
3. 在站内实际选择Dark default并保存，同样核对桌面暗色、手机暗色两份素材；桌面原始尺寸1200×470，手机720×922。
4. 读取currentSrc确认实际选图，检查source的屏宽条件仍存在，同时确认只有一个主题图组可见。随后刷新、从仓库返回主页再检查。
5. 恢复原主题。模拟系统深色可作为补充，但不代替站内切换；模拟390px视口不写成手机真机通过。

网站照片变大或变小则检查CSS发布与缓存：照片宽高比保留4:3，宽屏公式为min(100%, clamp(330px, 42dvh, 390px))，正文最大620px，后续内容自然下移；dvh表示动态视口高度。确认HTML样式链接中的内容指纹与实际CSS匹配，再读取计算宽度，不能把旧样式缓存当成证书问题。这些图片、CSS和选图检查均不需要更改CNAME、Enforce HTTPS或Cloudflare代理。

### 9.3 避免把内容发布当作证书操作

替换README插画、更新文字、复制源码或amend提交，不需要更改CNAME、DNS或Enforce HTTPS，也不能证明证书已经续签。平台可能因推送触发构建，是否构建、是否改变实际站点文件、是否成功签发证书，须分别核对。

发布状态记录读取时间、目标提交、发布根、绑定域名、证书状态及实际访问结果；不把某次截图、某个到期日或approved字段写成永久状态。仅维护文档时，不顺带修改域名、代理、证书或安全开关。

## 10. 回退与停用

回退旧网站时，依据变更前备份恢复本次改动的网站记录，并同步恢复旧托管端的绑定。避免一个域名指向新服务器，却只在旧服务器有有效证书。

完全停用自定义域名时，先移除指向GitHub Pages的DNS记录，再解除Pages绑定，并同步移除发布目录的CNAME。保留所有权验证可降低未来接管风险；DNS回退仍需等待缓存传播。

不要为了消除浏览器提示而删除证书校验、关闭所有安全警告、移除邮件记录或公开凭据。

## 11. 官方资料与续期参考

- [GitHub Pages域名所有权验证](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [GitHub Pages自定义域名与公共解析地址](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub Pages自定义域名与项目站点路径](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)
- [GitHub Pages域名与HTTPS排障](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages)
- [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [Cloudflare DNS记录管理](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
- [Cloudflare代理状态](https://developers.cloudflare.com/dns/proxy-status/)
- [Cloudflare Always Use HTTPS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/)
- [Chrome连接安全与警告说明](https://support.google.com/chrome/answer/95617?hl=en)

续期补充参考：[GitHub Community中转引的GitHub支持答复](https://github.com/orgs/community/discussions/191375)，说明代理配置会影响托管证书的自动续期。该答复不是固定续签日期或可用性保证。

配置界面、公共服务参数和证书策略可能变化，实际变更前核对官方资料。本文不声明任何具体域名已经通过验收，也不声明已建立自动告警。
