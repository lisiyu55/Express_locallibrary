const queryString = require('query-string');
var http = require('http');
var postData = queryString.stringify({
    'msg': 'Hello World!'
});

var options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/catalog',
    method: 'GET',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
    }
};

// var req = http.request(options, function (res) {
document.onload = http.request(options, function (res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        // var showblock = document.getElementById("showblock");
        chunks = JSON.parse(chunk);
        console.log(chunks.book_count);
        console.log(chunks.book_instance);
        console.log(chunks.book_instance_available);
        console.log(chunks.author);
        console.log(chunks.genre);

    });
});

req.on('error', function (e) {
    console.log('problem with request: ' + e.message);
});


// write data to request body
req.write(postData);
req.end();