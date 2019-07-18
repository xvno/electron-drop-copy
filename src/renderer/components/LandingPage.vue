<template>
  <div id="wrapper">
    <main>
      <el-container>
        <el-header>
          <el-button type="warning" round @click="reConnect()">重连</el-button>
          <el-button type="info" round @click="list()" :disabled="connecting">List</el-button>
          <el-button type="success" round @click="watchit()" :disabled="connecting">Watch</el-button>
          <el-button type="danger" round @click="offwatchit()" :disabled="connecting">Stop Watching</el-button>
        </el-header>
        <el-container v-loading="connecting" element-loading-text="连接失败">
          <el-aside width="200px">
            <div class="grid-content bg-purple dropzone" @drop="drop" @dragover="dragover"></div>
          </el-aside>
          <el-container>
            <el-main>
              <el-table :data="tableData" stripe style="width: 100%">
                <el-table-column prop="uid" label="uid" max-width="180"></el-table-column>
                <el-table-column prop="origin" label="Origin" max-width="180"></el-table-column>
                <el-table-column prop="progress" label="Progress">
                  <template slot-scope="scope">
                    <el-progress :percentage="scope.row.progress"></el-progress>
                    <el-button
                      v-if="scope.row.status === 5 && scope.row.trxed < scope.row.total"
                      @click="resumeUpload(scope.row)"
                      type="primary"
                      size="small"
                    >继续上传</el-button>
                    <el-button
                      v-if="scope.row.status === 1"
                      @click="pauseUpload(scope.row)"
                      type="primary"
                      size="small"
                    >暂停上传</el-button>
                    <el-button
                      v-if="scope.row.status === 0 || scope.row.status === 1 || scope.row.status === 2 || scope.row.status === 5"
                      @click="removeFile(scope.row)"
                      type="danger"
                      size="small"
                    >删除</el-button>
                  </template>
                </el-table-column>
                <el-table-column prop="statusText" label="状态" max-width="180"></el-table-column>
              </el-table>
            </el-main>
          </el-container>
        </el-container>
      </el-container>
    </main>
  </div>
</template>

<script>
import une from 'api/une'
import { Proxy, cmds } from 'api/deux'
import { showFormatError, showResponseStatusError } from 'api/errors'
import Vue from 'Vue'

export default {
  name: 'landing-page',
  data() {
    return {
      name: '',
      filedata: '',
      files: [],
      ws: null,
      proxy: null,
      connecting: true,
      messages: {},
      errors: [],
      store: null,
      fileRecords: {
        finished: [],
        toFinish: [],
        trxing: [],
        paused: [],
        pausing: [],
        removed: [],
        removing: [],
        resuming: []
      },
      STATES: {
        WAITING: 0,
        TRXING: 1,
        SUCCEEDED: 2,
        PAUSED: 5,
        REMOVED: 6
      },
      wsUri: 'ws://localhost:8080/files_trans' // 'ws://localhost:3333/ws'
    }
  },
  computed: {
    tableData() {
      let data = Object.values(this.fileRecords) || []
      let ret = []
      data.forEach(i => {
        if (i instanceof Array) {
          i.forEach(j => {
            if (j && j instanceof Object) {
              ret.push(j)
            }
          })
        }
      })
      return ret
    }
  },
  created() {
    let z = this
    z.store = localStorage
    // z.restoreData()
    z.name = une.getName()
    z.connect()
  },
  beforeRouteLeave(to, from, next) {
    // this.storeData()
  },
  beforeDestroy() {
    // this.storeData()
  },
  methods: {
    connect() {
      let z = this
      let ws = null
      try {
        ws = z.ws = new WebSocket(z.wsUri)
      } catch (e) {
        alert('Websocket: 建立连接出错')
        console.log(e)
      }

      ws.onerror = function(e) {
        if (ws.readyState !== 1) {
          alert('Websocket: 连接失败', z.wsUri)
          z.connecting = true
        }
      }

      ws.onopen = function(e) {
        z.connecting = false
        alert('Websocket: 成功连接到ws服务!')
        z.proxy = new Proxy(ws)
        z.proxy.ready = true
        z.list()
      }
      ws.onmessage = e => {
        try {
          let ret = JSON.parse(e.data)
          if (ret.code !== '200') {
            if (ret.code >= 300) {
              return showResponseStatusError(ret.msg)
            }
          }
          if (!ret.data) {
            return showFormatError(e.data)
          }
          let { cmd, data } = ret
          if (cmds.indexOf(cmd) > -1) {
            z.formatData(data.list)
          } else {
            showFormatError()
          }
        } catch (e) {
          showFormatError('错误, 不能被解析')
          console.log(e)
        }
      }
      ws.onclose = () => {
        if (z.proxy) {
          z.proxy.ready = false
        }
      }
    },
    reConnect() {
      let z = this
      if (z.ws && z.ws.readyState === 1) {
        z.ws.close()
      }
      z.connect()
    },
    formatData(list) {
      let z = this
      list.forEach(f => {
        z.preformatFile(f)
        // debugger
        let s = z.checkFileStatus(f)
        switch (s.code) {
          case 2:
            f.progress = 100
            z.setFileAsFinished(f)
            break
          case 1:
            if (f.progress >= 99) {
              f.progress = 99
              z.setFileAsToFinish(f)
            } else {
              z.setFileAsTrxing(f)
            }
            break
          case 3:
            z.setFileAsFailed(f)
            break
          case 5:
            z.setFileAsPaused(f)
            break
          case 6:
            z.setFileAsRemoved(f)
            break
          case 0:
            z.setFileAsWaiting(f)
            break
          default:
            showFormatError()
        }
      })
    },
    checkFileStatus(file) {
      let { trxed, total, status } = file
      let s = {
        code: 0,
        type: ''
      }
      switch (status) {
        case 0:
          s = {
            code: 0,
            type: 'waiting'
          }
          break
        case 1:
          s = {
            code: 1,
            type: 'trxing'
          }
          break
        case 2:
          s = {
            code: 2,
            type: 'succeeded'
          }
          break
        case 3:
          s = {
            code: 3,
            type: 'failed'
          }
          break
        case 5:
          s = {
            code: 5,
            type: 'paused'
          }
          break
        case 6:
          s = {
            code: 6,
            type: 'removed'
          }
          break
        default:
          s = {
            code: -1,
            type: 'unknown'
          }
          break
      }
      return s
    },
    checkStoreAvailable() {
      let ret = false
      if (this.errors) {
        if (this.store) {
          ret = true
          delete this.errors['store']
        } else {
          this.errors['store'] = 'Store not available!'
        }
      }
      return ret
    },
    setFileAsFinished(file) {
      this.setFile(file, 'finished')
    },
    setFileAsWaiting(file) {
      this.setFile(file, 'waiting')
    },
    setFileAsToFinish(file) {
      this.setFile(file, 'toFinish')
    },
    setFileAsFailed(file) {
      this.setFile(file, 'failed')
    },
    setFileAsPaused(file) {
      this.setFile(file, 'paused')
    },
    setFileAsPausing(file) {
      this.setFile(file, 'pausing')
    },
    setFileAsRemoved(file) {
      this.setFile(file, 'removed')
    },
    setFileAsRemoving(file) {
      this.setFile(file, 'removing')
    },
    setFileAsTrxing(file) {
      this.setFile(file, 'trxing')
    },
    getFile(uid) {
      return this.tableData.find(item => {
        return item.uid === uid
      })
    },
    setFile(file, category) {
      if (!file.uid || [0, 1, 2, 3, 5, 6].indexOf(file.status) === -1) {
        console.log(file)
        return showFormatError()
      }
      let z = this
      let fileRecords = z.fileRecords
      let dataHolder = fileRecords[category] // categorized data: finished, toFinish...
      let stateText = ''
      let state = ''
      let expectStates = []
      let fileRecord = this.getFile(file.uid)
      // if(fileRecords.)
      debugger
      console.log(fileRecord)
      if (fileRecords && fileRecords.expectStates && fileRecords.expectStates.indexOf(category) === -1) {
        state = fileRecords.state
        stateText = fileRecords.stateText
        expectStates = fileRecords.expectStates // 解决按钮事件后, 文件状态被新到的旧文件包的状态替换
      } else {
        state = category
        switch (category) {
          case 'waiting':
            stateText = '准备传输...'
            expectStates = ['failed', 'trxing', 'removing']
            break
          case 'finished':
            stateText = '已完成'
            expectStates = ['failed', 'removing']
            break
          case 'toFinish':
            stateText = '完成中...'
            expectStates = ['failed', 'finished']
            break
          case 'failed':
            stateText = '失败'
            break
          case 'paused':
            stateText = '已暂停'
            expectStates = ['failed', 'resuming', 'removing']
            break
          case 'pausing':
            stateText = '暂停中...'
            expectStates = ['failed', 'paused', 'removing']
            break
          case 'resuming':
            stateText = '恢复传输中...'
            expectStates = ['failed', 'waiting', 'trxing', 'removing']
            break
          case 'removed':
            stateText = '已删除'
            expectStates = ['failed']
            break
          case 'removing':
            stateText = '删除中...'
            expectStates = ['failed', 'removed']
            break
          case 'trxing':
            stateText = '传输中'
            expectStates = ['failed', 'pausing', 'removing']
            break
          default:
            state = 'unknown'
            stateText = '未知'
            break
        }
      }
      file.statusText = stateText
      file.expectStates = expectStates
      file.state = state
      if (dataHolder) {
        // Vue.set()
        // dataHolder[file.uid] = file
        dataHolder[file.uid] = file
      } else {
        fileRecords[category] = {
          [file.uid]: file
        }
      }
      let cats = Object.keys(fileRecords) || []
      let index = cats.indexOf(category)
      if (index > -1) {
        cats.splice(index, 1)
      }
      cats.forEach(cat => {
        if (fileRecords[cat] && fileRecords[cat][file.uid]) {
          delete fileRecords[cat][file.uid]
        }
      })
      z.fileRecords = Object.assign({}, fileRecords)
    },
    preformatFile(file) {
      let progress = Math.floor((100 * file.trxed) / file.total)
      if (progress > 0 && progress <= 100) {
        file.progress = progress
      } else {
        file.progress = 0
      }
    },
    resumeUpload(file) {
      let z = this
      if (file.status === 5) {
        z.proxy.send('resume', {
          list: [{ uid: file.uid }]
        })
      }
    },
    pauseUpload(file) {
      console.log(file)
      let z = this
      if (file.status === 1) {
        z.proxy.send('pause', {
          list: [{ uid: file.uid }]
        })
      }
      z.setFileAsPausing(file)
    },
    removeFile(file) {
      this.proxy.send('remove', {
        list: [{ uid: file.uid }]
      })
      this.setFileAsRemoving(file)
    },
    removeFileFromList(file) {
      let fileRecords = this.fileRecords
      let cats = Object.keys(fileRecords)
      cats.forEach(cat => {
        let list = fileRecords[cat]
        if (list) {
          delete list[file.uid]
        }
      })
      this.fileRecords = Object.assign({}, fileRecords)
    },
    open(link) {
      this.$electron.shell.openExternal(link)
    },
    openFile() {
      let z = this
      une.openFile(function(data) {
        z.filedata = data
      })
    },
    saveFile() {
      // une.showSaveDialog({
      //     title: '1st dialog window'
      // })
      let z = this
      une.saveFile(this.filedata, function() {
        z.filedata = ''
      })
    },
    showOpenGoDialog() {},
    showSaveGoDialog() {},
    drop(event) {
      let z = this
      // console.log('File(s) dropped')
      z.files = []
      event.preventDefault()
      event.stopPropagation()
      if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < event.dataTransfer.items.length; i++) {
          // If dropped items aren't files, reject them
          if (event.dataTransfer.items[i].kind === 'file') {
            // console.log(event.dataTransfer.files[i])
            var file = event.dataTransfer.items[i].getAsFile()
            // console.log('... file[' + i + '].name = ' + file.name)
            z.files.push({ origin: file.path }) //name: file.name,
            // z.files.push({ name: file.name, origin: file.path })
          }
        }
      } else {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < event.dataTransfer.files.length; i++) {
          // console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name)
          z.files.push({ origin: file.path }) // name: file.name,
          // z.files.push({ name: file.name, origin: file.path })
        }
      }
      if (z.files.length > 0) {
        // une.sendCmd(this.files)
        // upload(this.files, this.ws)
        z.proxy.send('upload', {
          list: z.files
        })
        z.proxy.send('watch')
      }
    },
    dragover(event) {
      console.log('File(s) in drop zone')
      event.preventDefault()
      event.stopPropagation()
    },
    list() {
      this.proxy.send('list')
    },
    watchit() {
      this.proxy.send('watch')
    },
    offwatchit() {
      this.proxy.send('offwatch')
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Source Sans Pro', sans-serif;
}

#wrapper {
  background: radial-gradient(
    ellipse at top left,
    rgba(255, 255, 255, 1) 40%,
    rgba(229, 229, 229, 0.9) 100%
  );
  height: 100vh;
  padding: 60px 80px;
  width: 100vw;
}

#logo {
  height: auto;
  margin-bottom: 20px;
  width: 420px;
}

main {
  display: flex;
  justify-content: space-evenly;
  flex-direction: column;
}

.dropzone {
  background-color: antiquewhite;
  /* border-radius: 1em; */
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.el-row {
  padding: 1em;
}
#p-file-list {
  background-color: antiquewhite;
}
.el-button {
  margin: 0.5em;
}
#wrapper > main {
  position: absolute;
  top: 60px;
  bottom: 60px;
  right: 80px;
  left: 80px;
}
.el-main {
  background-color: aquamarine;
  /* border-radius: 1em; */
  margin-left: 0.5em;
}
aside {
  position: relative;
}
</style>
