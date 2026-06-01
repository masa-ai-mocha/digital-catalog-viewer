# Digital Catalog Viewer MVP

PDFカタログをブラウザで読み込み、ページ閲覧・ブックマーク・商品リンク・QRコード導線を試せるMVPです。

## 技術選定

- Next.js: 将来的に管理画面、API、Supabase連携を同じ構成で拡張しやすいため
- TypeScript: Catalog、ProductLink、Bookmark、QrLinkのデータ構造を安全に扱うため
- Tailwind CSS: BtoBカタログ向けの清潔で控えめなUIを素早く整えるため
- pdf.js: PDFをブラウザ上でCanvas描画し、ページ単位表示に対応するため
- qrcode.react: 問い合わせURL、発注URLからQRコードをReact内で生成するため
- localStorage: MVP段階でサーバーなしに保存でき、後でSupabaseへ移行しやすい保存層に分けるため

## MVPで実装済み

- PDFアップロード
- PDFのページ表示
- 左右ボタン、ページクリック、キーボード左右キー、スワイプでページ移動
- PCの見開き表示、スマホの1ページ表示
- ページ番号指定で移動
- サムネイル一覧からページ移動
- ブックマーク追加、削除、一覧からページ復帰
- ページごとの商品URL登録と外部ECサイトへの遷移
- 問い合わせURL、発注URLなどからQRコード生成
- QRコードのモーダル拡大表示とPNGダウンロード
- Webサイト埋め込み用の `/embed` ページ
- 複数カタログを想定したデータ構造

## ディレクトリ構成

```text
app/
  embed/
    page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  AdminPanel.tsx
  CatalogApp.tsx
  CatalogViewer.tsx
  EmbedCatalogApp.tsx
  Modal.tsx
  PdfCanvasPage.tsx
  ProductLinksPanel.tsx
  QrPanel.tsx
  ThumbnailStrip.tsx
lib/
  pdf.ts
  storage.ts
  types.ts
samples/
  sample-catalog.pdf
```

## データ構造

主な型は [lib/types.ts](/Users/user/Documents/Codex/2026-05-27/claude-code-pdf-web-url-qr/lib/types.ts) に定義しています。

- Catalog: id、title、pdfUrl、totalPages、createdAt、updatedAt
- CatalogPage: catalogId、pageNumber、imageUrl/canvasData、thumbnailUrl
- ProductLink: catalogId、pageNumber、productName、productCode、productUrl、description、position情報
- Bookmark: catalogId、pageNumber、createdAt
- QrLink: catalogId、type、label、url、description

## 起動方法

```bash
pnpm install
pnpm dev
```

ブラウザで `http://localhost:3000` を開きます。

3000番ポートが使用中の場合は、次のように別ポートで起動できます。

```bash
pnpm dev -p 3001
```

npmを使う場合は次の流れでも動きます。

```bash
npm install
npm run dev
```

## 第1段階のVercel確認用設定

第1段階では、管理者ログインやDB保存を使わず、1冊の確認用カタログをアプリに同梱して公開できます。

確認用PDFは次の場所に置きます。

```text
public/catalogs/stage1-catalog.pdf
```

商品URLやQRのリンク先は [lib/stage1Catalog.ts](/Users/user/Documents/Codex/2026-05-27/claude-code-pdf-web-url-qr/lib/stage1Catalog.ts) で管理しています。

Vercelでリンク先だけ変えたい場合は、環境変数でも上書きできます。

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

クライアント確認用URLでは、`NEXT_PUBLIC_ENABLE_ADMIN=false` にすると右上の管理ボタンを隠せます。

Webサイトへ埋め込む場合は、公開URLの末尾に `/embed` を付けたURLをiframeで使います。

```html
<iframe
  src="https://xxxxxx.vercel.app/embed"
  width="100%"
  height="720"
  style="border:0; max-width:100%;"
  loading="lazy"
></iframe>
```

検索エンジンに出にくくするため、`noindex` と `public/robots.txt` を設定しています。ただし、これは厳密なアクセス制限ではありません。URLを知っている人だけに共有する「確認用」として使う想定です。

詳しい運用手順は [docs/OPERATIONS.md](/Users/user/Documents/Codex/2026-05-27/claude-code-pdf-web-url-qr/docs/OPERATIONS.md) にまとめています。
クライアント配布時のPDF差し替え、商品URL、QR URLの入れ方は [docs/CLIENT_DISTRIBUTION_GUIDE.md](/Users/user/Documents/Codex/2026-05-27/claude-code-pdf-web-url-qr/docs/CLIENT_DISTRIBUTION_GUIDE.md) を参照してください。

## 使い方

1. 右上の「管理」を開く
2. カタログ名を入力してPDFを選択
3. 商品URL登録でページ番号、商品名、品番、URLを追加
4. QRリンク設定で問い合わせURLや発注URLを保存
5. 「閲覧」に戻ってPDFビューア、ブックマーク、商品リンク、QRを確認

## 注意点

MVPではPDFをData URLとしてlocalStorageへ保存します。大容量PDFはブラウザの保存容量を超えることがあります。本番運用ではPDF本体をSupabase StorageやS3へ保存し、Catalog.pdfUrlには公開URLまたは署名付きURLを保持する構成に移行してください。

## 今後の拡張案

- Supabase Authで管理者ログインを追加
- Supabase DatabaseへCatalog、ProductLink、Bookmark、QrLinkを保存
- Supabase StorageへPDFとページサムネイルを保存
- react-pageflipで本格的なページめくり表現を追加
- ページ上の商品ホットスポット編集UIを追加
- PDF全文検索、品番検索、商品名検索を追加
- 資料請求フォーム、閲覧履歴、アクセス解析を追加
- カタログ公開URL、埋め込みタグ、営業担当別QRを追加
