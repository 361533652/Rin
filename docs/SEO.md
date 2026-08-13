# SEO 工作原理介绍与配置指南
## 前言
由于采用前后端分离的技术，导致搜索引擎无法直接获取到页面内容，因此需要通过 SEO 优化来提高搜索引擎的收录效果。本文将介绍本项目中 SEO 实现的工作原理与配置指南。

## 工作原理
本项目采用的 SEO 优化方案是通过 Github Action进行预渲染，将预渲染后的页面上传到 S3 存储桶，通过 Cloudflare Workers 代理请求，实现 SEO 优化。

预渲染是一个简单的爬虫。从提供的 SEO_BASE_URL 开始，每次请求一个页面，将渲染完成后的 html 内容上传至 S3 存储桶缓存。同时提取出页面中的所有链接，判断是否以 SEO_BASE_URL 开头或包含 SEO_CONTAINS_KEY 关键字，如果是则请求该链接并预渲染，直到没有新的链接为止。

## 配置指南
### 环境变量
在部署后端时，需要在 Github 配置以下环境变量（明文）：
```ini
SEO_BASE_URL=<SEO 基础地址，用于 SEO 索引，默认为 FRONTEND_URL>
SEO_CONTAINS_KEY=<SEO 索引时只索引以 SEO_BASE_URL 开头或包含SEO_CONTAINS_KEY 关键字的链接，默认为空>
S3_REGION=<S3 存储桶所在区域，如使用 Cloudflare R2 填写 auto 即可>
S3_ENDPOINT=<S3 存储桶接入点地址>
S3_FORCE_PATH_STYLE=false
CACHE_BUCKET=<缓存桶名称（RSS/SEO/配置缓存）>
CACHE_FOLDER=cache/
CACHE_ACCESS_HOST=<缓存桶访问地址>
```

以及以下环境变量（加密）：
```ini
S3_ACCESS_KEY_ID=<你的S3AccessKeyID>
S3_SECRET_ACCESS_KEY=<你的S3SecretAccessKey>
```

由于这些环境变量数量庞大且覆盖了相当一部分环境变量全列表，因此在 `v0.2.0` 及之后都建议在部署时直接在 Github 中添加这些环境变量，而不是通过 Cloudflare 面板添加。这样能够一定程度上减少配置的时间成本。

### 部署
在配置好环境变量后，即可在 Github Action 中手动触发一次 Workflow，一切正常的话很快就能部署完成。

### 配置 Workers 路由
在 Cloudflare Workers 面板中打开自己的域名详情页，点击 `Workers 路由`，添加一个新路由，路由填写为：
```
<前端域名>/seo/*
```
如：
```
xeu.life/seo/*
```
![图片](https://github.com/openRin/Rin/assets/36541432/ed0ecc72-f61f-4460-8ede-4475ca54ffcb)

Worker 选择为部署的 Worker，点击保存。

随后点击侧边栏菜单 > `规则` > `转换规则` > `重写 URL` > `创建规则`，规则名称随意，自定义筛选表达式为：
> [!NOTE]
> 默认覆盖主流搜索引擎爬虫（Google/Bing/百度/Yandex/搜狗/360/字节/神马/DuckDuckGo），如需其他爬虫按相同格式追加 `or http.user_agent contains "..."`。
>
> **粘贴注意**：表达式必须**纯 ASCII 半角**字符，不能用中文输入法输入的空格/引号；粘贴后确保是**单行、末尾无空格/换行**。若面板提示不支持，优先改用**可视化构建器**（见下文「可视化方式」），不要死磕表达式。
>
> **免费版限制**：`matches`（正则）运算符需要 Business/Enterprise 套餐，免费版只能用 `contains` 的 or 串联。
```
(http.host eq "<前端域名，如xeu.life>" and (http.user_agent contains "Googlebot" or http.user_agent contains "Bingbot" or http.user_agent contains "Baiduspider" or http.user_agent contains "YandexBot" or http.user_agent contains "Sogou" or http.user_agent contains "360Spider" or http.user_agent contains "Bytespider" or http.user_agent contains "YisouSpider" or http.user_agent contains "DuckDuckBot") and not starts_with(http.request.uri.path, "/sub/") and not starts_with(http.request.uri.path, "/seo/") and not starts_with(http.request.uri.path, "/assets/") and not starts_with(http.request.uri.path, "/locales/") and http.request.uri.path ne "/robots.txt" and http.request.uri.path ne "/particles.js")
```
> [!TIP]
> 对比单爬虫规则，只把 `http.user_agent contains "Googlebot"` 扩成 `( ... or ... )`，前后 `http.host eq` 与排除条件（`/sub/` sitemap/RSS、`/seo/` 预渲染、静态资源、robots.txt）保持不变，避免预渲染 URL 被二次重写。
>
> **可视化方式**：编辑规则时点「Edit expression」切到纯文本模式替换；若坚持用可视化构建器，则字段 `User Agent` → `contains` → 各爬虫值用 **Or** 连接，再 And 上 `Hostname` 等于 `<前端域名>` 及各排除条件。
重写路径设置为 `Dynamic`，值为：
```
concat("/seo",http.request.uri.path)
```
选择`保留查询`

参考配置截图：
![转换规则](https://github.com/openRin/Rin/assets/36541432/657e9546-1dc0-4390-9bfc-5d3eb725e792)

点击部署，即可完成 SEO 配置。

## 各平台提交清单

预渲染管线本身与平台无关，以下任一平台都消费同一份 sitemap 与同一套 `/seo/*` 缓存，按需在对应平台注册域名并提交 sitemap 即可：

| 平台 | 注册入口 | 提交地址 | 备注 |
|---|---|---|---|
| Google | [Google Search Console](https://search.google.com/search-console) | `https://rin.361533.xyz/sub/sitemap.xml` | 已验证 TXT，sitemap 待提交 |
| Bing | [Bing Webmaster Tools](https://www.bing.com/webmasters) | 同上 | 支持从 Search Console 一键导入，另支持 [IndexNow](https://www.indexnow.org/) 主动推送新文章 |
| 百度 | [百度搜索资源平台](https://ziyuan.baidu.com/) | 同上 | 已验证 meta（`codeva-c04lEKLb72`）；需要站点可被大陆网络访问（Cloudflare 免费版在国内延迟高但可爬）；建议开启站点「普通收录-手动提交」 |
| Yandex | [Yandex Webmaster](https://webmaster.yandex.ru/) | 同上 | 已验证 meta（`ecf80709671d13a7`）；俄语区，可选 |
| 搜狗 | [搜狗站长平台](http://zhanzhang.sogou.com/) | 同上 | 可选 |
| 神马/UC | [神马站长平台](https://zhanzhang.sm.cn/) | 同上 | 可选 |

**提交后验证**：用 `site:rin.361533.xyz` 在各平台站内查询确认收录；若某平台长时间未收录，先在该平台的「抓取/URL 检查」工具里确认它拿到的 HTML 是否超过空壳大小（>5KB 即有预渲染内容），避免排查时绕回预渲染链路。
