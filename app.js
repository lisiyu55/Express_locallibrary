var createError = require('http-errors');
var express = require('express');
//path用于解析文件和目录的库
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//路由目录下的模块用于处理特定的‘路由’（url路径）

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');  // 导入 catalog 路由
var app = express();

// 设置 Mongoose 连接
const mongoose = require('mongoose');
const mongoDB = 'mongodb://127.0.0.1:27017/my_database';
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB 连接错误：'));

// view engine setup
//设置views来指定模板的存储文件夹
//设置view engine 指定模板库pug
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
//将中间件添加进请求处理链

//可以将请求信息打印在控制台，便于开发调试
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//将项目根目录下所有静态文件托管至/public目录
//path.join(__dirname, 'public')返回的是绝对路径
app.use(express.static(path.join(__dirname, 'public')));

// 设置请求头
// application/json  接口返回json数据
// charset=utf-8 解决json数据中中文乱码
// app.use("*", function(request, response, next) {
//   response.writeHead(200, { "Content-Type": "application/json;charset=utf-8" });
//   response.end(JSON.stringify(request.headers));
//   // next();
// });

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);  // 将 catalog 路由添加进中间件链



app.get('/home', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/home/genres', function (req, res) {
  res.sendFile(__dirname + '/public/genres.html');
});

app.get('/home/genre/create', function (req, res) {
  res.sendFile(__dirname + '/public/genrecreate.html');
});

app.get('/home/genre/:id', function (req, res) {
  // var url = req.url;
  // id = url.substring(url.indexOf('genre') + 5);
  // var id = req.params.id;
  res.sendFile(__dirname + '/public/genre.html');
});

app.get('/home/genre/:id/update', function (req, res) {
  res.sendFile(__dirname + '/public/genreupdate.html');
});

app.get('/home/authors', function (req, res) {
  res.sendFile(__dirname + '/public/authors.html');
});
app.get('/home/author/create', function (req, res) {
  res.sendFile(__dirname + '/public/authorcreate.html');
});
app.get('/home/author/:id', function (req, res) {
  res.sendFile(__dirname + '/public/author.html');
});

app.get('/home/author/:id/update', function (req, res) {
  res.sendFile(__dirname + '/public/authorupdate.html');
});

app.get('/home/books', function (req, res) {
  res.sendFile(__dirname + '/public/books.html');
});
app.get('/home/book/create', function (req, res) {
  res.sendFile(__dirname + '/public/bookcreate.html');
});
app.get('/home/book/:id', function (req, res) {
  res.sendFile(__dirname + '/public/book.html');
});

app.get('/home/book/:id/update', function (req, res) {
  res.sendFile(__dirname + '/public/bookupdate.html');
});

app.get('/home/bookinstances', function (req, res) {
  res.sendFile(__dirname + '/public/bookinstances.html');
});
app.get('/home/bookinstance/create', function (req, res) {
  res.sendFile(__dirname + '/public/bookinstancecreate.html');
});
app.get('/home/bookinstance/:id', function (req, res) {
  res.sendFile(__dirname + '/public/bookinstance.html');
});

app.get('/home/bookinstance/:id/update', function (req, res) {
  res.sendFile(__dirname + '/public/bookinstanceupdate.html');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  //渲染出错页面
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
