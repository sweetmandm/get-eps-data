// getEPS.js

var fs = require('fs');
var casper = require('casper').create();

var basePath = 'http://financials.morningstar.com/ratios/r.html?t=';
var dataFile = 'eps-data.csv';
var years = 7;
var avgFile = 'eps-' + years + '-year-avg.csv';

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
    casper.echo("titles: " + titles);
    casper.echo("values: " + values);

    // Write the raw eps data to a csv file:
    //======================================
    fs.write(dataFile, ticker, 'a');
    fs.write(dataFile, '\n', 'a');
    fs.write(dataFile, titles.join(','), 'a');
    fs.write(dataFile, '\n', 'a');
    fs.write(dataFile, values.join(','), 'a');
    fs.write(dataFile, '\n\n', 'a');

    // trim out null values (don't do this earlier, it'll lose the date/val assoc)
    values = values.filter(function(item) { return item.indexOf('—') == -1 });

    // Write the eps average to a csv file:
    //=====================================
    extraIndex = (values.indexOf('TTM') != -1 ? 1 : 0)
    if (values.length >= years + extraIndex) {
      // arrays are ascending, switch to descending:
      titles.reverse();
      values.reverse();
      // Calculate the average:
      var sum = 0;
      // skip the trailing twelve months value
      var pos = titles.indexOf('TTM') + 1;
      casper.echo('TTM INDEX: ' + pos);
      for (var i=pos; i<years+pos; i++) {
        sum += parseFloat(values[i]);
      }
      var epsAvg = (sum === 0) ? 0 : sum/years;
      // Write to file:
      var epsAvgString = ticker + ',' + epsAvg + '\n'
      fs.write(avgFile, epsAvgString, 'a');
    } else {
      console.log(ticker + ' does not have ' + years + ' years of history')
    }
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
  // Read the symbols (single-line):
  //symbols = (fs.read('symbols.txt').split('\n')); 
  // Read the symbols (csv):
  symbols = fs.read('companylist.csv').split('\n');
  symbols = symbols.map( function(infoline) {
    return infoline.split(',')[0].replace(/"| /g, '');
  });
  if (symbols[0] === "Symbol") {
    symbols.shift();
  }
  console.log("symbols: " + symbols);

  // overwrite the existing data file
  fs.write(dataFile, '');
  fs.write(avgFile, '');

  // Get the data for each symbol:
  this.each(symbols, function(self, symbol) {
    self.then(function() {
      casper.echo("Getting EPS for symbol: " + symbol);
      getTickerData(symbol);
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

