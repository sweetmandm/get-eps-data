using SQLite

db = SQLiteDB("tickerdata.db")
tickers = query(db, "SELECT ticker, id FROM tickers")

tickernames = tickers.values[1]
tickerids = tickers.values[2]

for i in 1:tickerids[end]
  tickername = tickernames[i]
  tickerid = tickerids[i]
  res = query(db, "SELECT avg(eps) FROM earnings_per_share WHERE ticker_id == $tickerid ORDER BY year LIMIT 7")
  println(tickername * ": " * string(res.values[1][1]))
end

close(db)
