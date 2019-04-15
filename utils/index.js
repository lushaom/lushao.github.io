var {MongoClient} = require('mongodb');
exports.conn=function (callback) {
    // var CONN_DB_STR = "mongodb://localhost:27017/nodeP";
    var CONN_DB_STR = "mongodb://47.94.87.44:27017/nodeP";
    
    MongoClient.connect(CONN_DB_STR,(err,db)=>{
        if(err) {
            callback(err,null);
            throw err;
        }else{
            console.log('数据库链接成功!');
            callback(null,db);
        }
    })
};


exports.setError = function(err,res,db){
    if(err){
        res.json({
            errMsg:'数据库错误',
            code:0,
            type:200
        });
        throw err;
        db.close();
    }
};



// 判断是否登录
exports.checkIsLogin = function(username,res,callback){
    if(username){
        callback();  // 已经登录进行 callback 操作
    }else{
        res.send(`<script>window.alert('当前处于未登录状态,请重新登录');location.href='/' </script>`);
    }
};
