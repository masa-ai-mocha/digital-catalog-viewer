# Digital Catalog Viewer 運用準備メモ

## 第1段階: 自分・クライアント確認用

目的は、1冊のPDFカタログをVercelで公開し、URLを知っている人だけに共有して確認してもらうことです。管理者ログインやDB保存はまだ使いません。

### できる状態

- VercelでWeb公開
- 確認用PDFを1冊表示
- 商品URLを数件表示
- 問い合わせQRと発注QRを表示
- 検索エンジンに出にくいよう `noindex` 設定

### PDFの差し替え

確認用PDFは次の場所に置きます。

```text
public/catalogs/stage1-catalog.pdf
```

本番確認用PDFに差し替える場合は、同じファイル名で上書きしてください。Vercelに再デプロイすると、共有URLの中身も更新されます。

### 商品URL・QR URLの変更

簡単に変えるなら、Vercelの環境変数で変更します。

```text
NEXT_PUBLIC_STAGE1_CATALOG_TITLE
NEXT_PUBLIC_STAGE1_PDF_URL
NEXT_PUBLIC_STAGE1_TOTAL_PAGES
NEXT_PUBLIC_STAGE1_PRODUCT_URL_1
NEXT_PUBLIC_STAGE1_PRODUCT_URL_2
NEXT_PUBLIC_STAGE1_INQUIRY_URL
NEXT_PUBLIC_STAGE1_ORDER_URL
NEXT_PUBLIC_ENABLE_ADMIN
```

商品名や品番も変えたい場合は [lib/stage1Catalog.ts](/Users/user/Documents/Codex/2026-05-27/claude-code-pdf-web-url-qr/lib/stage1Catalog.ts) を編集します。

### ローカル確認

```bash
pnpm install
pnpm dev
```

ブラウザで開きます。

```text
http://localhost:3000
```

確認すること:

- PDFが表示される
- ページめくりできる
- PCで見開き表示になる
- スマホ幅で1ページ表示になる
- 商品リンクが別タブで開く
- 問い合わせQR、発注QRが表示される

### Vercel公開手順

1. GitHubにこのプロジェクトをpushする
2. Vercelで「Add New Project」を選ぶ
3. GitHubリポジトリを選ぶ
4. Framework PresetがNext.jsになっていることを確認する
5. 必要に応じて環境変数を設定する
6. Deployを押す
7. 発行されたURLを開いて表示確認する

第1段階では、発行されたURLをクライアント確認用URLとして共有します。

公開確認用に管理ボタンを隠したい場合は、Vercelの環境変数に次を設定してください。

```text
NEXT_PUBLIC_ENABLE_ADMIN=false
```

注意: 第1段階は「URLを知っている人だけに共有する」確認用です。パスワード保護ではありません。本当に外部から見えない状態が必要な場合は、第2段階の管理者ログイン・公開/非公開機能へ進みます。

## 第2段階: クライアント納品用

必要になる追加実装:

- Supabase Authで管理者ログイン
- Supabase StorageへPDF保存
- Supabase Databaseへカタログ、商品リンク、QRリンク保存
- 管理画面から商品リンクとQRを編集
- 公開/非公開切り替え
- `/catalog/[slug]` 形式のカタログURL発行

この段階に進むと、管理画面で更新した内容が全閲覧者へ反映されます。

## 第3段階: サービス化

必要になる追加実装:

- クライアント別管理
- 複数カタログ管理
- 閲覧数、商品リンククリック数、QRクリック数の分析
- 商品リンクCSV一括登録
- PDF差し替え機能
- 独自ドメイン対応
- 月額保守向けの更新運用フロー

## クライアントへ送る確認文例

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

修正があれば、対象ページと修正内容をお知らせください。
```
