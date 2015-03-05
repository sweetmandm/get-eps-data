# getEPS.rb

require 'rubygems'
require 'nokogiri'
require 'sqlite3'

def usage
  puts 'usage: getEPS.rb <directory_of_morningstar_scrape>'
end

def main
  scrapedir = ARGV[0]
  if !scrapedir 
    usage
    exit
  end
  setupDatabase
  epsFromFiles scrapedir
end

def epsFromFiles (scrapedir)
  files = Dir.entries(scrapedir)
  while f = files.pop
    puts 'Getting ' + f
    path = File.expand_path scrapedir + '/' + f
    page = Nokogiri::HTML(File.open(path))
    values = extractEpsValues page
    if values
      ticker = f[0...f.index('.')]
      makeEpsRecords ticker, values
    else 
      puts 'no values: ' + f
    end
  end
end

def extractEpsValues (page)
  titles = page.css('table.r_table1 thead tr th[id^="Y"]').map do |i|
    i.content
  end
  eps = page.css('td[headers$="i5"]').map do |i|
    i.content
  end
  unless titles.length == 0 || eps.length == 0
    values = Array.new
    titles.each_with_index do |title, idx|
      if title.include?('-')
        dateComponents = title.split /-/
        values.push({:year => dateComponents[0],
                     :month => dateComponents[1],
                     :eps => eps[idx]})
      end
    end
    return values
  end
end

def makeEpsRecords (ticker, values) 
  @db.execute("INSERT INTO tickers (ticker) VALUES ('#{ticker}');")
  values.each do |value|
    if (value[:eps].to_s.index('—') == nil)
      makeEpsRecord ticker, value[:year], value[:month], value[:eps]
    end
  end
end

def makeEpsRecord (ticker, year, month, eps)
  ticker_id = @db.execute <<-SQL
    SELECT id FROM tickers WHERE ticker == '#{ticker}';")
  SQL
  @db.execute <<-SQL
    INSERT INTO earnings_per_share (ticker_id, year, month, eps)
    VALUES (#{ticker_id[0][0].to_i}, #{year.to_i}, #{month.to_i}, #{eps.to_f});
  SQL
end

def setupDatabase
  @dbpath = 'tickerdata.db'
  File.delete(@dbpath)
  @db = SQLite3::Database.new 'tickerdata.db'
  @db.execute <<-SQL
    CREATE TABLE tickers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT
    );
  SQL
  @db.execute <<-SQL
    CREATE TABLE earnings_per_share (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker_id INTEGER, 
      year INTEGER,
      month INTEGER,
      eps REAL
    );
  SQL
end

#===
main
#===
