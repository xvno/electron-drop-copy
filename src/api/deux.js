const electron = require('electron');
const { ipcRenderer } = require('electron')


function initMessage(cmd, opt) {
    return {
        cmd: cmd || '',
        opt: opt || {}
    }
}

export function Proxy(ws, ecb = console.log) {
    this.ws = ws;
    this.ready = false;
    this.ecb = ecb;
    this.methodsNames = ['upload', 'list', 'pause', 'resume', 'remove', 'watch', 'offwatch'];
    return this;
}

Proxy.prototype.send = function (cmd, opt = {}) {
    let z = this;
    if (z.ready) {
        if (z.methodsNames.includes(cmd)) {
            let msg = initMessage(cmd, opt); // z.methods[cmd](opt)
            z.ws.send(JSON.stringify(msg));
        } else {
            z.ecb('未能正确识别命令: ' + cmd);
        }
    } else {
        z.ecb('WebSocket未连接');
    }
}