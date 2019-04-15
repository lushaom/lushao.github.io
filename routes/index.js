

var express = require('express');
var router = express.Router();
var fs = require('fs');
var {waterfall, series} = require("async");
var {conn, setError} = require('../utils');
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.get('/home', (req, res) => {

    res.render('home', {title: '首页'})

});


router.get('/seek', (req, res) => {
    var seek = req.query.seek;
    // console.log(query);
    conn((err, db) => {
        setError(err, res, db);


    });

});


router.get("/admin", (req, res) => {
    var arr = JSON.parse(req.session.result);
    var title = [];
    title.push(arr);


    var pageNo = req.query.pageNo * 1 || 0;
    var query = req.query;
    var seek = req.query.seek;
    console.log(seek);
    var obj = {};
    for (var key in query) {
        if (key !== "pageNo") {
            obj[key] = query[key];
        }
    }

    var total = 0;
    var pageSize = 10; // 每页显示数据
    var totalPage = 0;
    // 分页处理
    var findData = function (db, callback) {

        var user = db.collection("user");
        series([
            function (callback) {
                user.find({
                    $and: [
                        {
                            $or: [
                                {username: new RegExp(seek)},
                                {section: new RegExp(seek)},
                                {id: new RegExp(seek)},
                            ]
                        },
                        {username: {$nin: ["admin"]}}
                    ]
                }, {}).toArray((err, result) => {
                    total = result.length;
                    totalPage = Math.ceil(total / pageSize);
                    pageNo = pageNo <= 1 ? 1 : pageNo;
                    pageNo = pageNo >= totalPage ? totalPage : pageNo;
                    callback(err, result.length);
                })
            },
            (callback) => {
                user.find({
                    $and: [
                        {
                            $or: [
                                {username: new RegExp(seek)},
                                {section: new RegExp(seek)},
                                {id: new RegExp(seek)},
                            ]
                        },
                        {username: {$nin: ["admin"]}}
                    ]
                }, {}).skip((pageNo - 1) * pageSize).limit(pageSize).sort({_id: 1}).toArray((err, result) => {
                    callback(err, result)
                })
            },
        ], (err, result) => {
            setError(err, res, db);

            callback(result);
        })

    };

    conn((err, db) => {
        setError(err, res, db);

        findData(db, (result) => {
            result = result[1].map((item) => {
                return item;
            });

            //console.log(result, 123);


            db.collection('user').distinct("section", (err, result1) => {


                res.render("admin", {
                    result,
                    result1,
                    totalPage,
                    pageNo,
                    total,
                    title,
                    pageSize
                });
                db.close()
            });


        })
    })

});


router.get('/seekPosition', (req, res) => {
    var section = JSON.parse(req.query.section);
    var position = JSON.parse(req.query.position);

    conn((err, db) => {
        setError(err, res, db);
        db.collection('user').find({section, position}).toArray((err, result) => {
            res.json({
                result
            })

        })
    })
});


router.get('/gainUsername', (req, res) => {
    var arr = JSON.parse(req.session.result);
    var title = [];
    title.push(arr);

    res.json({
        arr
    })
});

router.get('/updateUser', (req, res) => {
    var id = req.query.id;
    var username = req.query.username;
    var password = req.query.password * 1;
    var section = req.query.section;
    var position = req.query.position;

    // console.log(username, id, password, section, position);


    conn((err, db) => {
        setError(err, res, db);

        if (position === '部门主管') {
            db.collection('user').update({section, position}, {$set: {position: '员工'}}, (err, result) => {
                db.collection('user').update({id}, {
                    $set: {
                        username,
                        password,
                        section,
                        position
                    }
                }, (err, result) => {

                    console.log(result);
                    res.redirect('admin');
                    db.close();
                })
            })

        } else {
            db.collection('user').update({id}, {
                $set: {
                    username,
                    password,
                    section,
                    position
                }
            }, (err, result) => {

                console.log(result);
                res.redirect('admin');
                db.close();
            })
        }


    })
});


router.get('/addUser', (req, res) => {
    var username = req.query.username;
    var password = req.query.password;
    var section = req.query.section;
    var position = req.query.position;
    var id = req.query.id;


    conn((err, db) => {
        setError(err, res, db);
        if (position === '部门主管') {

            db.collection('user').update({section, position}, {$set: {position: '员工'}}, (err, result) => {
                db.collection('user').insert({username, password, section, position, id}, (err, result) => {
                    console.log(result);
                    res.redirect('admin');
                    db.close()
                })
            })

        } else {
            db.collection('user').insert({username, password, section, position, id}, (err, result) => {
                console.log(result);
                res.redirect('admin');
                db.close()
            })
        }

    });
});


router.get('/updateBtn', (req, res) => {
    var id = JSON.parse(req.query.id);
    var obj = {};
    obj.id = id;
    console.log(obj)
    conn((err, db) => {
        setError(err, res, db);
        db.collection('user').find(obj).toArray(
            (err, result) => {
                res.json({
                    code: 200,
                    type: 1,
                    result
                });
                db.close()
            }
        )
    })
});


router.get('/addUserBtn', (req, res) => {

    conn((err, db) => {
        setError(err, res, db);
        db.collection('user').find({username: {$nin: ["admin"]}}, {}).toArray(
            (err, result) => {
                res.json({
                    code: 200,
                    type: 1,
                    result
                });
                db.close()
            }
        )
    })
});


router.get('/seeID', (req, res) => {
    var id = req.query.id;
    conn((err, db) => {
            setError(err, res, db);
            db.collection('user').findOne({id}, {}, (err, result) => {
                res.json({
                    code: 200,
                    type: 1,
                    result
                });
                db.close()
            })
        }
    )
});
router.post("/ec", (req, res) => {
    var body = req.body;
    console.log(body);

    conn((err, db) => {
        setError(err, res, db);
        db.collection('user').find({username: {$nin: ["admin"]}}, {}).toArray((err, result) => {
            res.json({
                code: 200,
                msg: '注册-success',
                result
            })
        })
    });

})
router.get('/delete', (req, res) => {
    var id = req.query.id;
    console.log(JSON.parse(id));
    JSON.parse(id).map((item, index) => {
        //console.log(item)
        conn((err, db) => {
            setError(err, res, db);
            db.collection('user').deleteMany(item, (err, result) => {
                console.log("删除成功");
                db.close()
            })
        })
    });
    res.redirect('admin')
});

router.get('/admindiv', (req, res) => {

    var arr = JSON.parse(req.session.result);
    var title = [];
    title.push(arr);


    var pageNo = req.query.pageNo * 1 || 0;
    var query = req.query;
    var seek = req.query.seek;
    // console.log(seek);
    var obj = {};
    for (var key in query) {
        if (key !== "pageNo") {
            obj[key] = query[key];
        }
    }

    var total = 0;
    var pageSize = 10; // 每页显示数据
    var totalPage = 0;
    // 分页处理
    var findData = function (db, callback) {

        var user = db.collection("user");
        series([
            function (callback) {
                user.find({
                    $and: [
                        {
                            $or: [
                                {username: new RegExp(seek)},
                                {section: new RegExp(seek)},
                                {id: new RegExp(seek)},
                            ]
                        },
                        {username: {$nin: ["admin"]}},
                        {position: "部门主管"}
                    ]
                }, {}).toArray((err, result) => {
                    total = result.length;
                    totalPage = Math.ceil(total / pageSize);
                    pageNo = pageNo <= 1 ? 1 : pageNo;
                    pageNo = pageNo >= totalPage ? totalPage : pageNo;
                    callback(err, result.length);
                })
            },
            (callback) => {
                user.find({
                    $and: [
                        {
                            $or: [
                                {username: new RegExp(seek)},
                                {section: new RegExp(seek)},
                                {id: new RegExp(seek)},
                            ]
                        },
                        {username: {$nin: ["admin"]}},
                        {position: "部门主管"}
                    ]
                }, {}).skip((pageNo - 1) * pageSize).limit(pageSize).sort({_id: 1}).toArray((err, result) => {
                    callback(err, result)
                })
            },
        ], (err, result) => {
            setError(err, res, db);

            callback(result);
        })
    };

    conn((err, db) => {
        setError(err, res, db);

        findData(db, (result) => {
            result = result[1].map((item) => {
                return item;
            });

            console.log(result);
            db.collection('user').find({username: {$nin: ["admin"]}}, {}).toArray((err, data) => {
                res.render("admindiv", {
                    result,
                    data,
                    totalPage,
                    pageNo,
                    total,
                    title,
                    pageSize
                });
            });

            db.close()
        });


    })


});


router.get('/deleteSec', (req, res) => {
    var section = JSON.parse(req.query.section);

    conn((err, db) => {
        setError(err, res, db);


        db.collection('user').remove(section, (err, result) => {
            if (result) {
                console.log(result);
                res.redirect('/admindiv')
            }

        })

    })
});


router.get('/seekSection', (req, res) => {
    var section = req.query.section;
    console.log(section);
    conn((err, db) => {
        setError(err, res, db);
        db.collection('user').findOne({section}, (err, result) => {
            res.json({
                result
            })
        })
    })
});


router.get('/addSection', (req, res) => {
    var username = req.query.username;
    var section = req.query.section;
    var position = req.query.position;
    conn((err, db) => {
        setError(err, res, db);
        db.collection('user').updateOne({username}, {$set: {section, position}}, (err, result) => {
            res.redirect('/admindiv')
        })
    })
});

router.get('/addSectionModal', (req, res) => {
    var username = req.query.username;

    conn((err, db) => {
        setError(err, res, db);
        db.collection('user').findOne({username}, (err, result) => {
            res.json({
                result
            })
        })
    })
});


router.get('/updatePassword', (req, res) => {
    var username = req.query.username;
    var password = req.query.password;

    console.log(username);

    conn((err, db) => {
        setError(err, res, db);
        db.collection('user').updateOne({username}, {$set: {password}}, (err, result) => {
            res.json({
                result
            })
        })
    })
});


router.get('/updateSectionDiv', (req, res) => {
    let username = req.query;

    conn((err, db) => {
        setError(err, res, db);
        console.log(username)
        db.collection('user').findOne(username, (err, result) => {
            console.log(result)
            res.json({
                result
            })
        })
    })

});

router.get('/updateBtnAd', (req, res) => {
    var username = JSON.parse(req.query.username);
    conn((err, db) => {
        setError(err, res, db);
        db.collection('user').findOne({username}, (err, result) => {
            res.json({
                result
            })

        })
    })

});

router.get('/updateSection', (req, res) => {
    var oldUsername = JSON.parse(req.query.oldUsername);
    var username = req.query.username;
    var section = req.query.section;
    var position = req.query.position;

    conn((err, db) => {
        setError(err, res, db);
        db.collection('user').updateOne({username}, {$set: {section, position}}, (err, result) => {

            if (oldUsername !== username) {
                db.collection('user').updateOne({username: oldUsername}, {$set: {position: '员工'}}, (err, result) => {
                    res.redirect('/admindiv')
                });
            } else {
                res.redirect('/admindiv')
            }


        })
    })
});

router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    })
});

router.get('/manleave', (req, res) => {
    var result = JSON.parse(req.session.result);
    // console.log(result);
    var arr = [];
    arr.push(result);


    conn((err,db)=>{
        setError(err,res,db);
        db.collection('leave').find({section:result.section}).toArray((err,result)=>{
            console.log(result);
            res.render('manleave', {title: arr,result})
        })
    });


});

router.get('/askLeave',(req,res)=>{
    var id = req.query;
    console.log(id);
    conn((err,db)=>{
        setError(err,res,db);
        db.collection('leave').findOne(id,(err,result)=>{
            res.json({
                result
            })
        })
    })
});

router.get('/upLeave',(req,res)=>{
    var query = req.query;
    console.log(query);

    conn((err,db)=>{
        setError(err,res,db);
        db.collection('leave').update({id:query.id},{$set:query},(err,result)=>{
            res.redirect('manleave')
        })

    })
});

router.get('/leaveDel',(req,res)=>{
    var id = req.query.id;
    conn(
        (err,db)=>{
            db.collection('leave').findOne({id},(err,result)=>{
                res.json({
                    result
                })
            })
        }
    )

});


router.get('/leaveDelete',(req,res)=>{
    var id = req.query.id;
    console.log(id)
    conn(
        (err,db)=>{
            db.collection('leave').remove({id},(err,result)=>{
                res.redirect('leave')
            })
        }
    )
});

router.get('/manager', (req, res) => {
    var arr = JSON.parse(req.session.result);
    var title = [];
    title.push(arr);


    var pageNo = req.query.pageNo * 1 || 0;
    var query = req.query;
    var seek = req.query.seek;
    console.log(seek);
    var obj = {};
    for (var key in query) {
        if (key !== "pageNo") {
            obj[key] = query[key];
        }
    }

    var total = 0;
    var pageSize = 10; // 每页显示数据
    var totalPage = 0;
    // 分页处理
    var findData = function (db, callback) {

        var user = db.collection("user");
        series([
            function (callback) {
                user.find({
                    $and: [
                        {
                            $or: [
                                {username: new RegExp(seek)},
                                {section: new RegExp(seek)},
                                {id: new RegExp(seek)},
                            ]
                        },
                        {position: {$nin: ["部门主管"]}},
                        {section: arr.section}
                    ]
                }, {}).toArray((err, result) => {
                    total = result.length;
                    totalPage = Math.ceil(total / pageSize);
                    pageNo = pageNo <= 1 ? 1 : pageNo;
                    pageNo = pageNo >= totalPage ? totalPage : pageNo;
                    callback(err, result.length);
                })
            },
            (callback) => {
                user.find({
                    $and: [
                        {
                            $or: [
                                {username: new RegExp(seek)},
                                {section: new RegExp(seek)},
                                {id: new RegExp(seek)},
                            ]
                        },
                        {position: {$nin: ["部门主管"]}},
                        {section: arr.section}
                    ]
                }, {}).skip((pageNo - 1) * pageSize).limit(pageSize).sort({_id: 1}).toArray((err, result) => {
                    callback(err, result)
                })
            },
        ], (err, result) => {
            setError(err, res, db);

            callback(result);
        })

    };

    conn((err, db) => {
        setError(err, res, db);

        findData(db, (result) => {
            result = result[1].map((item) => {
                return item;
            });

            //console.log(result, 123);


            db.collection('user').distinct("section", (err, result1) => {


                res.render("manager", {
                    result,
                    result1,
                    totalPage,
                    pageNo,
                    total,
                    title,
                    pageSize
                });
                db.close()
            });


        })
    })
});

router.get('/updateUserManager', (req, res) => {
    var id = req.query.id;
    var username = req.query.username;
    var password = req.query.password * 1;
    var section = req.query.section;
    var position = req.query.position;


    conn((err, db) => {
        setError(err, res, db);

        db.collection('user').update({id}, {
            $set: {
                username,
                password,
                section,
                position
            }
        }, (err, result) => {

            console.log(result);
            res.redirect('manager');
            db.close();
        })

    })
});

router.get('/addUserManager', (req, res) => {
    var username = req.query.username;
    var password = req.query.password;
    var section = req.query.section;
    var position = req.query.position;
    var id = req.query.id;


    conn((err, db) => {
        setError(err, res, db);

        db.collection('user').insert({username, password, section, position, id}, (err, result) => {
            console.log(result);
            res.redirect('manager');
            db.close()
        })

    });
});


router.get('/deleteSection', (req, res) => {
    var id = req.query.id;
    console.log(JSON.parse(id));
    JSON.parse(id).map((item, index) => {
        //console.log(item)
        conn((err, db) => {
            setError(err, res, db);
            db.collection('user').deleteMany(item, (err, result) => {
                console.log("删除成功");
                db.close()
            })
        })
    });
    res.redirect('manager')
});

router.get('/staff', (req, res) => {
    var arr = JSON.parse(req.session.result);
    var title = [];
    title.push(arr);

    res.render('staff', {arr, title})


});

router.get('/leave', (req, res) => {

    var arr = JSON.parse(req.session.result);
    var title = [];
    title.push(arr);

    conn((err, db) => {
        setError(err, res, db);

        db.collection('leave').find({username: arr.username}).toArray((err, result) => {
            setError(err, res, db);

            if (result) {
                res.render('leave', {arr, title, result, code: 1});
            } else {
                res.render('leave', {arr, title, result:'暂无请假数据', code: 0});
            }

            db.close();
        })
    });

});

router.get('/leaveBtn', (req, res) => {


    let query = req.query;

    conn((err,db)=>{
        setError(err,res,db);
        db.collection('leave').insert(query,(err,result)=>{
            res.redirect('leave')
        })
    });


});

router.get('/addUserBtnLeave', (req, res) => {
    conn((err, db) => {
        setError(err, res, db);
        db.collection('leave').find({}, {}).toArray(
            (err, result) => {
                res.json({
                    code: 200,
                    type: 1,
                    result
                });
                db.close()
            }
        )
    })
});


router.post('/login', (req, res) => {
    var body = req.body;
    var username = body.username;
    var password = body.password;
    console.log(username, password);


    conn((err, db) => {
        setError(err, res, db);
        db.collection('user').findOne({username, password}, (err, result) => {

            console.log(result, username, password);
            if (result) {
                if (result.position === "管理员") {
                    req.session.result = JSON.stringify(result);
                    res.redirect('admin')
                } else if (result.position === "部门主管") {
                    req.session.result = JSON.stringify(result);
                    res.redirect('manager');
                } else {
                    req.session.result = JSON.stringify(result);
                    res.redirect('staff');
                }

            } else {
                res.redirect('/')
            }

            //  console.log(result);
            db.close();
        })
    });
});


router.get('/loginUse', (req, res) => {
    var username = req.query.username;
    conn((err, db) => {
        setError(err, res, db);
        db.collection('user').findOne({username}, (err, result) => {
            res.json({
                result
            })
        })
    })
});


router.get("/socket", (req, res) => {
    var result = JSON.parse(req.session.result);
    // console.log(result);
    var arr = [];
    arr.push(result);
    res.render("socket", {
        username: req.session.username,
        title: arr
    });
});



//图片上传
var path = require('path');
router.post('/upload', function(req, res){

    //收到上传图片请求后，以管道的形式交给busboy处理
    req.pipe(req.busboy);
    //接收文件上传，就执行后面匿名函数方法
    // fieldname字段名字、file文件对象、filename文件名字、encoding使用的编码、mimetype文件类型
    req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype){
        // new Date().getTime()表示当前时间戳，然后转换字符串
        // path.extname获取文件的后缀名
        var newFilename = String(new Date().getTime()) + path.extname(filename);
        var filePath = __dirname + '/../public/upload/' + newFilename;
        var url = '/upload/' + newFilename; //上传文件新的路径
        //将文件转换成管道形式，以流的形式写进指定路径
         file.pipe(fs.createWriteStream(filePath));

        // 文件写完结束后，执行以下函数返回信息
        file.on('end', function(){
            var fullpath = req.headers.origin + url;
            return res.json({errno:0,data:[fullpath]})
        });

    });


});


module.exports = router;
