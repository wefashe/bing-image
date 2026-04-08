# bing-wallpaper

必应壁纸 —— 每日必应壁纸的收集与展示。

众所周知，必应的背景图片非常精美且每日更新，非常适合作为壁纸。最近搜集了一些相关资源总结如下。

## API

必应给不同国家提供壁纸内容有一定差异，可以在 API 中通过 `mkt` 参数来指定区域。大概有以下具有独特内容的国家代码：

> `en-US` `en-GB` `de-DE` `en-CA` `ja-JP` `zh-CN` `fr-FR` `pt-BR` `it-IT` `es-ES` `en-IN` `en-AU` `en-NZ`

响应中的图片链接格式为：

```
https://www.bing.com/th?id=OHR.FlamingosNamibia_ZH-CN3639748956_1920x1080.jpg
```

图片分辨率可以通过链接中的 `_1920x1080` 部分来调整。比如 4K 分辨率可以改为 `_UHD`，纵向图片可以改为 `_1080x1920` 等。

### 1. 必应壁纸客户端 API

```
https://services.bingapis.com/ge-apps/api/v2/bwc/hpimages?mkt=zh-cn&theme=bing&defaultBrowser=ME&dhpSetToBing=True&dseSetToBing=True
```

- 图片元信息全面
- 返回内容不受 IP 限制
- 包含今天和过去一周的壁纸信息
- 默认获取 4K 分辨率的壁纸

### 2. 必应网页 API

```
https://cn.bing.com/hp/api/model
或
https://www.bing.com/hp/api/model?mkt=en-US
```

- 图片元信息全面，包含标题、副标题、故事描述、速览知识、版权等
- 除图片信息外还包含大量其他数据
- 如果 IP 地址在中国大陆会强制返回中国地区的数据
- 默认获取 1080P 分辨率的壁纸
- 包含今天、过去一周和下一周的壁纸信息

### 3. HPImageArchive API

```
https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US
```

- 获取到的元信息不包含图片描述
- 可以通过 `idx` 参数来指定日期偏移，比如 `idx=0` 表示今天，`idx=1` 表示昨天，依此类推
- `n` 参数指定获取的壁纸数量，这两个参数的范围都是 `[0, 8]`，通过调整可以获取到一周之前的壁纸信息
- 获取到的链接要加上 `https://www.bing.com` 前缀构成完整的图片链接
- 如果 IP 地址在中国大陆会强制返回中国地区的数据

### 获取故事接口

| 接口 | 地址 | 适用日期 |
|------|------|---------|
| 旧接口 | `cn.bing.com/cnhp/coverstory?d=YYYYMMDD` | 2014 ~ 20190228 |
| 新接口 | `cn.bing.com/search?q=1&filters=HpDate:"YYYYMMDD_1600"` | 20190228 至今（需解析 HTML） |

> ⚠️ 以上 API 仅供个人学习和研究使用。请合理使用这些接口，避免频繁请求造成服务器负担。所有图片仅限于作为个人壁纸使用，其版权归原作者所有。

## 历史存档

| 名称 | 说明 |
|------|------|
| [Bing Wallpaper Archive](https://github.com/nicholasgasior/gmw) | 可能是最全的存档，保存了从 2009 年至今 11 个国家的必应壁纸图片。图片元信息仅有标题和版权信息 |
| [bing-wallpaper-api](https://github.com/nicholasgasior/gmw) | 2016 年至今的元信息，包括标题、版权信息、日期和图片链接等 |
| [Bing-Wallpaper-Archive](https://github.com/nicholasgasior/gmw) | 保存了 2024 年至今的壁纸元信息，包括标题、描述、版权信息、日期、图片原始链接等 |
