# 四分位数と箱ひげ図

『大学入学共通テスト「情報Ⅰ」対策問題集』（技術評論社, ISBN 978-4-297-15084-6）pp.21-22 連動Webアプリ。

**公開URL**: https://technical-reviewer-information1.github.io/data-to-quartile-boxplot/

箱ひげ図は「データを4等分した目印」を並べただけの図です。数を並べ替えるところから手を動かして、箱とひげの意味をつかみましょう。

## 技術

静的な HTML / CSS / JavaScript のみで動作します。ビルド不要・外部CDN不使用・サーバ通信なし。
GitHub Pages で配信しており、Python や Streamlit は不要です。スマートフォン／タブレット／PC に対応。

```
index.html
css/style.css   全アプリ共通スタイル
css/app.css     このアプリ固有のスタイル
js/app.js       画面制御
```

`streamlit_app.py` は旧版（Streamlit Community Cloud 用）です。

---
Created by Dit-Lab.(Daiki ITO) / Supported by Tomoaki ATSUMI
