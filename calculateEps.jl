using SQLite
db = SQLiteDB("tickerdata.db")

tickers = query(db, "SELECT id FROM tickers")
for ticker in tickers
  res = query(db, "SELECT avg(eps) FROM earnings_per_share WHERE ticker_id == $id ORDER BY year LIMIT 7")
  println(ticker * res)
end
