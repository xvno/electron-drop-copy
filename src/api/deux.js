const electron = require('electron');
const { ipcRenderer } = require('electron')

// module.exports.upload = function (fileList) {
//     let msg = initMessage('upload', { list: fileList });
//     ws.send(JSON.stringify(msg));
// }
// module.exports.list = function () {
//     let msg = initMessage('list', {});
//     ws.send(JSON.stringify(msg));
// }
// module.exports.watch = function (fileList, interval = 500) {
//     let msg = initMessage('watch', { list: fileList, interval });
//     ws.send(JSON.stringify(msg));
// }
// module.exports.offwatch = function (fileList) {
//     let msg = initMessage('offwatch', { list: fileList });
//     ws.send(JSON.stringify(msg));
// }


function initMessage(cmd, opt) {
    return {
        cmd: cmd || '',
        opt: opt || {}
    }
}

export default class Proxie {
    constructor(ws, ecb = console.log) {
        this.ws = ws;
        this.ready = false;
        this.ecb = ecb;
        // this.methods = {
        //     upload(opt) {
        //         let msg = initMessage('upload', opt);
        //         ws.send(JSON.stringify(msg));
        //     },
        //     list(opt) {
        //         let msg = initMessage('list', opt)
        //         ws.send(JSON.stringify(msg));
        //     },
        //     watch(opt) {
        //         let msg = initMessage('watch', opt);
        //         ws.send(JSON.stringify(msg));
        //     },
        //     offwatch(opt) {
        //         let msg = initMessage('offwatch', opt);
        //         ws.send(JSON.stringify(msg));
        //     }
        // }
        // this.methodsNames = Object.keys(this.methods);
        this.methodsNames = ['upload', 'list', 'watch', 'offwatch'];
    }
    send(cmd, opt = {}) {
        if (this.ready) {
            if (this.methodsNames.includes(cmd)) {
                let msg = initMessage(cmd, opt); // this.methods[cmd](opt)
                this.ws.send(JSON.stringify(msg));
            }
        } else {
            ecb('WebSocket未连接');
        }
    }
}

export function Proxy(ws, ecb = console.log) {
    this.ws = ws;
    this.ready = false;
    this.ecb = ecb;
    this.methodsNames = ['upload', 'list', 'watch', 'offwatch'];
    return this;
}

Proxy.prototype.send = function (cmd, opt = {}) {
    let z = this;
    if (z.ready) {
        if (z.methodsNames.includes(cmd)) {
            let msg = initMessage(cmd, opt); // z.methods[cmd](opt)
            z.ws.send(JSON.stringify(msg));
        }
    } else {
        z.ecb('WebSocket未连接');
    }
}