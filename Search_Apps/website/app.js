var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const client = require('./client')
const crawl = require('./new_crawler')
var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// app.use('/search', searchRouter);

app.post("/search", async function(request, response) {
  console.log("Within post function")
  var temp = await client.myFunction(request.body.text)
  console.log("temp = " + JSON.stringify(temp))
  response.send(temp)
})

app.post("/crawl", async function(request, response) {
  console.log("Within crawl function")
  var temp = await crawl.myFunctionCrawl(request.body.url)
  console.log("temp = " + temp)
  response.send(temp)
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
