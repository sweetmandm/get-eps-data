var fs = require('fs');
var casper = require('casper').create();

var basePath = 'http://financials.morningstar.com/ratios/r.html?t='

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
var symbols = [];
casper.start().then(function () {
  // Read the symbols:
  symbols = (fs.read('symbols.txt').split('\n')); 
  // Get the data for each symbol:
  this.each(symbols, function(self, symbol) {
    self.then(function() {
      casper.echo("Getting EPS for symbol: " + symbol);
      getTickerData(symbol);
    });
  });
});

casper.run();

