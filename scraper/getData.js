// getRatios.js

var fs = require('fs');
var casper = require('casper').create();

// Input
var tickerFile = '../tickers/nasdaq-3-5-2015.csv';
var BEGIN_TICKER = ''
// Output
var scrapedir = destinationDirectory();
console.log(scrapedir);

var basePath = 'http://financials.morningstar.com/ratios/r.html?t=';

var symbols = getSymbols(tickerFile);
console.log("symbols: " + symbols);

function destinationDirectory() {
  var currentTime = new Date();
  var dirname = (currentTime.getFullYear() + "-" +
                 (currentTime.getMonth() + 1) + "-" + 
                 currentTime.getDate());
  return fs.pathJoin(fs.workingDirectory, '../data/html', dirname);
}

function getSymbols(source) {
  var symbols = fs.read(source).split('\n');
  symbols = symbols.map( function(infoline) {
    return infoline.split(',')[0].replace(/"| /g, '');
  });
  if (symbols[0] === "Symbol") { symbols.shift(); }
  if (BEGIN_TICKER != '') {
    while (symbols[0] !== BEGIN_TICKER) { symbols.shift(); }
  }
  return symbols;
}

function pathForTicker(ticker) {
  return (basePath + ticker);
}

function getTickerData(ticker) {
  if (ticker == '') { casper.echo('Empty ticker string'); return; }
  var url = pathForTicker(ticker);
  casper.open(url).then(function() {
    filename = ticker + ".html";
    filepath = fs.pathJoin(scrapedir, filename);
    fs.write(filepath, this.getPageContent(), 'w');
  });
}

//===============================
// Errors
//===============================
casper.on('error', function(msg,backtrace) {
  this.echo("=========================");
  this.echo("ERROR:");
  this.echo(msg);
  this.echo(backtrace);
  this.echo("=========================");
});

casper.on("page.error", function(msg, backtrace) {
  this.echo("=========================");
  this.echo("PAGE.ERROR:");
  this.echo(msg);
  this.echo(backtrace);
  this.echo("=========================");
});

//===============================
// Start
//===============================
casper.userAgent(
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9) AppleWebKit/537.71 (KHTML, like Gecko) Version/7.0 Safari/537.71'
);

casper.start().then(function () {
  // Get the data for each symbol:
  this.each(symbols, function(self, symbol) {
    self.then(function() {
      casper.echo("Getting page for symbol: " + symbol);
      getTickerData(symbol);
      // todo: test different values and see where rate-limiting starts
      sleep(5000);
    });
  });
});

function sleep(ms) {
  var start = new Date().getTime(), expire = start + ms;
  while (new Date().getTime() < expire) { }
  return;
}

casper.run();

