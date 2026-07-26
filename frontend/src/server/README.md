# サーバー層

`SUPABASE_SERVICE_ROLE_KEY` を使う処理は、この層だけに置く。UI とクライアントコンポーネントから `supabase.from()` を直接呼ばず、サーバー側の関数を経由してデータへアクセスする。
