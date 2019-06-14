const electron = require('electron');
const { ipcRenderer } = require('electron')


module.exports.getName = function () {
    return 'get a name';
};

// module.exports.showOpenDialog = function (fn) {
//     ipcRenderer.send('showOpenDialog', '~/Desktop')
// };

module.exports.showSaveDialog = function () {
    ipcRenderer.send('showSaveDialog', '~/Desktop')
};


const fs = require('fs');
const { dialog } = electron.remote
module.exports.openFile = function (fn) {
    dialog.showOpenDialog(function (fileNames) {
        if (fileNames === undefined) return;
        var fileName = fileNames[0];
        fs.realpath(fileName, function (err, realpath) {
            console.log(realpath);
        });
        fs.readFile(fileName, 'utf-8', function (err, data) {
            // console.log(data);
            fn(data);
        });
    });
}

module.exports.saveFile = function (data, fn) {
    dialog.showSaveDialog(function (fileName) {
        if (fileName === undefined) return;
        fs.writeFile(fileName, data, function (err) {
            if (!err) {
                dialog.showMessageBox({
                    message: "文件已保存",
                    buttons: ["OK"]
                }, index => {
                    console.log(index);
                    fn();
                });
            }
        });

    });

}
// const SMB2 = require('@marsaud/smb2');

// // create an SMB2 instance
// const smb2Client = new SMB2({
//     share: 'smbuser',
//     domain: '192.168.1.180',
//     username: 'smbuser',
//     password: '1234',
// });
// module.exports.showSambaOpenDialog = function () {

// };
// module.exports.showSambaSaveDialog = function () {

// };

module.exports.dropHandler = function (event) {
    console.log('File(s) dropped');
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < event.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (event.dataTransfer.items[i].kind === 'file') {
                console.log(event.dataTransfer.files[i]);
                var file = event.dataTransfer.items[i].getAsFile();
                console.log('... file[' + i + '].name = ' + file.name);
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < event.dataTransfer.files.length; i++) {
            console.log(event.dataTransfer.files[i]);
            console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name);
        }
    }
}
module.exports.ondragoverHandler = function (event) {
    console.log('File(s) in drop zone');

    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();
    event.stopPropagation();
}


const { exec } = require('child_process');
const path = require('path');

module.exports.sendCmd = function (files) {
    files.forEach(file => {
        let p = path.resolve(file.path, file.name)
        // console.log(`$HOME/Downloads/cp-go/cp1 ${p} ${file.name}`);
        let cmd = `go-cp1 ${file.path} ${file.name}`;
        exec(cmd, function (e) {
            console.log('jobs done!', e);
            if (e) {
                console.log('So, what happened?')
                alert(`文件传输!!!失败: ${file.name}`);
                return false;
            }
            alert(`文件已传输: ${file.name}`);
        });
        // exec(`cp1 ${p} ${'~/Downloads/cp-go/outputs/' + file.name}`);

    });
}