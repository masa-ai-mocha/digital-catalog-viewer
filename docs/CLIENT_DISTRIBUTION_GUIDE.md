# クライアント配布用 基本運用ガイド

このガイドは、第1段階の「クライアント確認用・ポートフォリオ用」として、Vercelで公開したデジタルカタログを配布するための基本手順です。

## まず知っておくこと

現在のMVP版では、管理画面で登録した内容は主にそのブラウザ内に保存されます。つまり、マサさんのPCで管理画面から登録しても、クライアントや別の人のPCには同じ内容が反映されない場合があります。

そのため、クライアントに配布するURLで確実に同じ内容を見せたい場合は、次の方法で設定します。

- PDFはGitHubの `public/catalogs/` に置く
- カタログ名、商品URL、問い合わせURL、発注URLはVercelの環境変数または `lib/stage1Catalog.ts` で設定する
- 設定後、Vercelで再デプロイする

本格的な納品版では、SupabaseにPDFや商品リンクを保存し、管理画面で編集した内容が全員に反映される形に移行します。

## 基本の流れ

1. クライアントからPDFとリンク情報をもらう
2. PDFを軽くしてファイル名を整える
3. GitHubへPDFをアップロードする
4. 商品URL、問い合わせURL、発注URLを設定する
5. Vercelで再デプロイする
6. 公開URLを開いて確認する
7. クライアントに確認URLを送る
8. 必要に応じて、クライアントサイトへ埋め込みコードを渡す

## クライアントからもらうもの

最低限、以下をもらいます。

| 種類 | 内容 |
| --- | --- |
| PDFカタログ | 完成済みのPDF |
| カタログ名 | 例: タイルカタログ 2026 |
| 商品情報 | 商品名、品番、掲載ページ |
| 商品URL | ECサイトや商品詳細ページのURL |
| 問い合わせURL | 問い合わせフォーム、LINE、Googleフォームなど |
| 発注URL | 発注フォーム、ECカート、注文ページなど |

最初は5〜10ページ程度、10MB以下のPDFで確認するのがおすすめです。

## PDFをどこにアップするか

第1段階では、PDFはGitHubの次の場所に置きます。

```text
public/catalogs/stage1-catalog.pdf
```

現在のアプリは、初期表示用PDFとしてこのファイルを読み込みます。

### PDF差し替え手順

1. PDFファイル名を `stage1-catalog.pdf` に変更する
2. GitHubのリポジトリを開く
3. `public` → `catalogs` フォルダを開く
4. `Add file` → `Upload files` を押す
5. 新しい `stage1-catalog.pdf` をドラッグする
6. 同名ファイルの更新として保存する
7. `Commit changes` を押す
8. Vercelで自動デプロイ、または手動で `Redeploy` する

PDFのページ数が変わる場合は、Vercelの環境変数 `NEXT_PUBLIC_STAGE1_TOTAL_PAGES` も変更します。

## オンラインストアURLをどこに入れるか

リンク先URLだけを変えたい場合は、Vercelの環境変数で変更できます。

| 用途 | Vercel環境変数 |
| --- | --- |
| 商品1のURL | `NEXT_PUBLIC_STAGE1_PRODUCT_URL_1` |
| 商品2のURL | `NEXT_PUBLIC_STAGE1_PRODUCT_URL_2` |
| 問い合わせURL | `NEXT_PUBLIC_STAGE1_INQUIRY_URL` |
| 発注URL | `NEXT_PUBLIC_STAGE1_ORDER_URL` |
| カタログ名 | `NEXT_PUBLIC_STAGE1_CATALOG_TITLE` |
| PDFページ数 | `NEXT_PUBLIC_STAGE1_TOTAL_PAGES` |
| 管理ボタン非表示 | `NEXT_PUBLIC_ENABLE_ADMIN=false` |

### Vercelでの設定手順

1. Vercelで `digital-catalog-viewer` プロジェクトを開く
2. 左メニューの `環境変数` を開く
3. `キー` に環境変数名を入れる
4. `値` にURLや文字を入れる
5. 保存する
6. `Deployments` から最新デプロイを `Redeploy` する

例:

```text
NEXT_PUBLIC_STAGE1_PRODUCT_URL_1=https://example-shop.com/products/cloud
NEXT_PUBLIC_STAGE1_PRODUCT_URL_2=https://example-shop.com/products/blanc
NEXT_PUBLIC_STAGE1_INQUIRY_URL=https://example.com/contact
NEXT_PUBLIC_STAGE1_ORDER_URL=https://example.com/order
NEXT_PUBLIC_ENABLE_ADMIN=false
```

## 商品名・品番・掲載ページを変える場所

商品名、品番、掲載ページ、説明文を変える場合は、次のファイルを編集します。

```text
lib/stage1Catalog.ts
```

この中の `productLinks` に商品リンク情報が入っています。

見る場所の例:

```ts
productName: "サンプル商品 CLOUD",
productCode: "CLD-001",
pageNumber: 1,
productUrl: process.env.NEXT_PUBLIC_STAGE1_PRODUCT_URL_1 || "https://example.com/products/cloud",
description: "第1段階の動作確認用商品リンクです。"
```

変更する内容:

| 項目 | 意味 |
| --- | --- |
| `productName` | 表示する商品名 |
| `productCode` | 品番 |
| `pageNumber` | 表示するページ番号 |
| `productUrl` | 商品ページURL |
| `description` | 商品説明文 |

商品を3件以上出したい場合は、`productLinks` に同じ形で追加します。

## 問い合わせQR・発注QRをどこに入れるか

問い合わせQRと発注QRのリンク先だけなら、Vercel環境変数で変更できます。

```text
NEXT_PUBLIC_STAGE1_INQUIRY_URL
NEXT_PUBLIC_STAGE1_ORDER_URL
```

表示名や説明文も変える場合は、`lib/stage1Catalog.ts` の `qrLinks` を編集します。

例:

```ts
{
  id: "stage1-qr-inquiry",
  catalogId: "stage1-catalog",
  type: "inquiry",
  label: "お問い合わせ",
  url: process.env.NEXT_PUBLIC_STAGE1_INQUIRY_URL || "https://example.com/contact",
  description: "スマホで読み取って問い合わせページを開けます。"
}
```

## 管理画面は使っていいか

第1段階では、管理画面は動作確認用として使えます。ただし、管理画面で登録した内容はそのブラウザ内に保存されます。

クライアントへ配布するURLに確実に反映したい内容は、GitHub・Vercel側で設定してください。

クライアント確認用URLでは、管理画面を見せない方が安全です。

Vercelの環境変数に以下を入れます。

```text
NEXT_PUBLIC_ENABLE_ADMIN=false
```

## 配布前チェックリスト

公開URLを開いて、以下を確認します。

- PDFが表示される
- ページ送りができる
- PCで見開き表示になる
- スマホで1ページ表示になる
- ページ番号移動ができる
- 商品リンクが正しい外部ページで開く
- 問い合わせQRが読み取れる
- 発注QRが読み取れる
- 右上の管理ボタンが表示されていない
- クライアントに見せてよいPDF・リンクだけになっている

## Webサイトへ埋め込む場合

通常の閲覧URLとは別に、Webサイト埋め込み専用のURLを使います。

```text
https://xxxxxx.vercel.app/embed
```

クライアントのWebサイトには、次のようなiframeコードを貼ります。

```html
<iframe
  src="https://xxxxxx.vercel.app/embed"
  width="100%"
  height="720"
  style="border:0; max-width:100%;"
  loading="lazy"
></iframe>
```

高さはサイトに合わせて調整できます。

| 表示用途 | heightの目安 |
| --- | --- |
| PCサイトの本文内 | `720`〜`840` |
| LPのメインコンテンツ | `820`〜`960` |
| スマホ中心 | `640`〜`760` |

埋め込み専用ページでは、アプリ上部のヘッダーや管理ボタンを出さず、カタログ閲覧に集中できる表示になります。商品リンク、問い合わせQR、発注QR、ブックマークは下部操作から開けます。

## クライアントへ送る文面

```text
デジタルカタログの確認URLをお送りします。

▼確認URL
https://xxxxxx.vercel.app

以下をご確認ください。
・PDFの表示
・ページめくり
・商品リンクの遷移
・問い合わせQRコード
・発注QRコード
・スマホ表示

修正がある場合は、該当ページ番号と修正内容をお知らせください。
```

Webサイト埋め込みも渡す場合は、次の文を追加できます。

```text
Webサイトへ埋め込む場合は、以下のコードをページ内に貼り付けてください。

<iframe
  src="https://xxxxxx.vercel.app/embed"
  width="100%"
  height="720"
  style="border:0; max-width:100%;"
  loading="lazy"
></iframe>
```

## 第2段階で改善すること

本格的にクライアントへ納品する場合は、次の改善を入れると運用が楽になります。

- PDFをSupabase Storageに保存
- 商品リンクをSupabase Databaseに保存
- QRリンクをSupabase Databaseに保存
- 管理者ログインを追加
- 管理画面で編集した内容を全閲覧者に反映
- 公開・非公開の切り替え
- カタログごとのURL発行
- 商品リンクのCSV一括登録
