const QScan = require('../src/index');

const q =  new QScan({
    modelOpts: {
        'wx-default': {
            udid: '7PTS4TDAGM9DLNEU',
            port: '4723',
            opts: {
                user: 'xxxx',
                pass: 'xxxx'
            }
        }
    }
});
const task = q.run({
    modelName: 'wx-default',
    type: 'ide-login-scan'
},
err => {
    if (err) {
        console.log(err);
    }
});

