var fs = require('fs');
var casper = require('casper').create();

var basePath = 'http://financials.morningstar.com/ratios/r.html?t='
var dataFile = 'eps-data.csv'

function pathForTicker(ticker) {
  return (basePath + ticker);
}

function getEPS() {
  // Snag the eps values from the table:
  var values = document.querySelectorAll('td[headers$="i5"]');
  return Array.prototype.map.call(values, function(e) {
    return e.innerHTML;
  });
}

function getTitles() {
  // Select the table row that contains the year labels:
  var titles = document.querySelectorAll('table.r_table1 thead tr th[id^="Y"]');
  return Array.prototype.map.call(titles, function(e) {
    return e.innerHTML;
  });
}

function getTickerData(ticker) {
  if (ticker == '') { casper.echo('Empty ticker string'); return; }

  var url = pathForTicker(ticker);
  casper.open(url).then(function() {

    casper.echo('[*] Opened url: ' + url);

    var titles = this.evaluate(getTitles);
    var values = this.evaluate(getEPS);

    // The arrays should have the same length:
    casper.echo("titles length: " + titles.length + " items: " + titles);
    casper.echo("values length: " + values.length + " items: " + values);

    fs.write(dataFile, ticker, 'a');
    fs.write(dataFile, '\n', 'a');
    fs.write(dataFile, titles.join(','), 'a');
    fs.write(dataFile, '\n', 'a');
    fs.write(dataFile, values.join(','), 'a');
    fs.write(dataFile, '\n\n', 'a');
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
var symbols = [];
casper.start().then(function () {
  // Read the symbols:
  symbols = (fs.read('symbols.txt').split('\n')); 

  // overwrite the existing data file
  fs.write(dataFile, '');

  // Get the data for each symbol:
  this.each(symbols, function(self, symbol) {
    self.then(function() {
      casper.echo("Getting EPS for symbol: " + symbol);
      getTickerData(symbol);
    });
  });
});

casper.run();

