var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  //构建 LocalLibrary 最常使用的响应方法是 render()，它使用模板和数据创建并返回 HTML 文件
  // res.render('index', { title: 'Express' });
  res.redirect('/catalog');

//   // var json = res.json(JSON.stringify({data: index, message: success}));
//   // console.log(json);

//   // res.writeHead(200, { "Content-Type": "text/html" });
//   // res.end("Welcome to the homepage!");

//   var answer = "";
//   answer += "Request URL: " + req.url + "\n";
//   answer += "Request type: " + req.method + "\n";
//   answer += "Request headers: " + JSON.stringify(req.headers) + "\n";

//   // 将答案发送出去
//   res.writeHead(200, { "Content-Type": "text/plain" });
//   res.end(answer);
});


// 增加url 依赖
var urllib = require('url');
// 初始数据
var data = {
    status: '100', 
    msg: '操作成功',
    data: {
        userId: '123456',
        userName: 'hgdqstudio',
        blog: 'http://hgdqstudio.online'
    }
};
// get请求
router.get('/', function (req, res, next) {
    var params = urllib.parse(req.url, true);
    var query2 = params.query;
    // 打印get请求中的接口参数
    console.log(query2);
    res.writeHead(200, { "Content-Type": "application/json;charset=utf-8" });
    res.end(JSON.stringify(data));
});

module.exports = router;
