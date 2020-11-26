// mqtt設定
var num = "1";
var sd = require('silly-datetime');
var mqtt = require('mqtt');
var opt = {
    port: 1883,
    clientId: 'nodejs',
    username: 'PK5WSEH0SBUA13XT4K',
    password: 'PK5WSEH0SBUA13XT4K'
};

//sql設定
var mysql = require('mysql');
var conn = mysql.createPool({
    host: '140.130.35.236',
    user: 'usblab',
    password: 'usblab603',
    database: 'animals_tracks'
});

// 連接MQTT
var hostname = 'tcp://61.58.248.108';
var client = mqtt.connect(hostname, opt);
client.on('connect', function () {
    console.log('已連接至MQTT：' + hostname + '\n');
    client.subscribe("/test/#");
});

// 接收訊息
client.on('message', function (topic, message) {
    console.log('收到 ' + topic + ' 主題，訊息：' + message.toString() + '\n');
    dataProcess(message);
    console.log('第' + num++ + '筆' + '\n');
});

//資料處理
function dataProcess(message) {
    var json = JSON.parse(message);
    let a = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    console.log(json);
    for (var i = 0, len = json.length; i < len; i++) {
        if (1 <= json[i].ID <= 6 && json[i].Z_axis == 1 || json[i].Z_axis == 0) {

            callsql(json[i].ID, a, json[i].X_axis, json[i].Y_axis, json[i].Z_axis);

        } else {
            console.log('資料格式錯誤!');
        }
    }
}

// 呼叫資料庫
function callsql(ID, DateTime, X_axis, Y_axis, Z_axis) {

    conn.getConnection(function (err, connection) {
        if (err) throw err;
        //sendData(ID, DateTime, X_axis, Y_axis, Z_axis);

        //傳送資料
        console.log("ID:" + ID, ",DateTime:" + DateTime, ",X_axis:" + X_axis, ",Y_axis:" + Y_axis, ",Z_axis:" + Z_axis);
        var sql = "INSERT INTO `coordinates` (`ID`, `DateTime`, `X_axis`, `Y_axis`, `Z_axis`) VALUES (?, ?, ?, ?, ?)";
        var params = [ID, DateTime, X_axis, Y_axis, Z_axis];
        connection.query(sql, params, function (err, result) {
            if (err) throw err;
            console.log("傳送：", ID, DateTime, X_axis, Y_axis, Z_axis, "放入資料庫 顯示", DateTime);
        });
        connection.release();
    });
}

//判斷日期
function isExistDate(dateStr) {
    var dateObj = dateStr.split('-'); // yyyy/mm/dd

    //列出12個月，每月最大日期限制
    var limitInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    var theYear = parseInt(dateObj[0]);
    var theMonth = parseInt(dateObj[1]);
    var theDay = parseInt(dateObj[2]);
    var isLeap = new Date(theYear, 1, 29).getDate() === 29; // 是否為閏年? //月份值由0開始

    if (isLeap) {
        // 若為閏年，最大日期限制改為 29
        limitInMonth[1] = 29;
    }

    // 比對該日是否超過每個月份最大日期限制
    return theDay <= limitInMonth[theMonth - 1];
}

//debug
process.on('uncaughtException', function (err) {
    console.error("Caugh exception:" + err);
})
