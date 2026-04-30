# 4コマJSON NINJA

SNS向けの4コマ漫画JSONと生成promptを作る、30秒スコアアタックのThree.jsミニゲームです。プレイヤーは光るJSON断片を集め、赤いバグ障害物を避けてスコアを伸ばします。ゲーム終了時にスコアに応じた4コマ漫画JSONとpromptが表示されます。

## 使い方

`index.html` をブラウザで開くだけで動きます。GitHub Pagesにそのまま配置できる静的ファイル構成で、認証、DB、ビルド工程はありません。

## 生成ファイル

- `index.html`
- `style.css`
- `app.js`
- `README.md`

## 収益化と共有

ゲームオーバー画面に Stripe checkout の購入解除リンクを配置しています。スコアは `#KGNINJA` 付きのX共有テキストに入り、SNSで成果を拡散できます。
