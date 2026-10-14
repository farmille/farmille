# Gen Interface JP の英数字の字間

本文は Gen Interface JP 0.8.0 を使用する。英数字は同書体の Inter 由来の字形を取り出し、送り幅を補正した `Farmille Gen Latin` を使う。輪郭と左サイドベアリング、同じサブセット内の英数字のカーニング、等幅数字を維持する。右サイドベアリングは送り幅の補正に合わせて減る。

CSS の字間は 0.04em とし、英数字の送り幅から 0.02em を引く。フォントの座標単位は 2048 units/em のため、補正量は最も近い整数の 41 units とする。実効値は約 0.01998em となり、16px の文字での丸め誤差は1文字あたり約 0.00031px。和欧間の空白は `text-autospace: normal` によって別に加わる。

対象は半角の A–Z、a–z、0–9 と、等幅数字への置換グリフ。記号・全角英数字・日本語は元のフォントを使う。字間を文字ごとに保つため、英数字の合字は含めない。hero の MB101 は補正対象にしない。

## 再生成

```sh
python3 -m venv /tmp/farmille-font-tools
/tmp/farmille-font-tools/bin/pip install -r scripts/fonts/requirements.txt
/tmp/farmille-font-tools/bin/python scripts/fonts/generate-latin.py
pnpm exec oxfmt src/theme/fonts/latin.css
```

入力は `pnpm-lock.yaml` で固定した npm パッケージ内の WOFF2。元ファイルの SHA-256 は `src/theme/fonts/sources.sha256` に記録する。生成済みの CSS と WOFF2 を同梱するため、通常のアプリのビルドに Python は不要。

元の著作権表示と OFL は `src/theme/fonts/OFL.txt` に同梱する。書体を更新した場合は、再生成したファイルとハッシュをレビューし、英数字・和文・混在文・等幅数字・入力欄の表示を確認する。
