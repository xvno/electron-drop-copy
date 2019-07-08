<template>
  <div id="wrapper">
    <!-- <img id="logo" src="~@/assets/logo.png" alt="electron-vue"> -->
    <main>
      <el-container>
        <el-header>
          <!-- <el-button type="primary" round @click="openFile()">Open</el-button>
          <el-button type="success" round @click="saveFile()">Save</el-button>-->
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
              <!--
              <div class="doc" v-show="filedata.length > 0">
                                <p ref="data">{{filedata}}</p>
              </div>
              -->
              <el-table :data="tableData" stripe style="width: 100%">
                <el-table-column prop="uid" label="uid" max-width="180"></el-table-column>
                <el-table-column prop="origin" label="Origin" max-width="180"></el-table-column>
                <el-table-column prop="progress" label="Progress">
                  <template slot-scope="scope">
                    <el-progress :percentage="scope.row.progress"></el-progress>
                    <!-- <el-button
                                            @click="handleClick(scope.row)"
                                            type="text"
                                            size="small"
                                        >查看</el-button>
                    <el-button type="text" size="small">编辑</el-button>-->
                  </template>
                </el-table-column>
              </el-table>
            </el-main>
          </el-container>
        </el-container>
        <!-- <el-footer>Footer</el-footer> -->
      </el-container>
    </main>
  </div>
</template>

<script>
import SystemInformation from './LandingPage/SystemInformation'
import une from 'api/une'
import { Proxy } from 'api/deux'
import Vue from 'Vue'

export default {
  name: 'landing-page',
  components: { SystemInformation },
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
      fileRecords: [],
      fileRecordsToFinish: [],
      fileRecordsTrxing: [],
      wsUri: 'ws://localhost:8080/files_trans' // 'ws://localhost:3333/ws'
    }
  },
  computed: {
    tableData() {
      let z = this
      return [
        ...Object.values(z.fileRecords),
        ...Object.values(z.fileRecordsToFinish),
        ...Object.values(z.fileRecordsTrxing)
      ]
    }
  },
  created() {
    this.store = localStorage
    this.restoreData()
    let z = this
    z.name = une.getName()
    this.connect()
  },
  beforeRouteLeave(to, from, next) {
    this.store()
  },
  beforeDestroy() {
    this.store()
  },
  methods: {
    connect() {
      let z = this
      let ws = null
      try {
        ws = z.ws = new WebSocket(z.wsUri)
      } catch (e) {
        alert('Websocket: connecting error')
        console.log(e)
      }

      ws.onerror = function(e) {
        if (ws.readyState !== 1) {
          alert('Websocket: 连接失败', wsUri)
          this.connecting = true;
        }
      }

      ws.onopen = function(e) {
        z.connecting = false
        alert('Websocket: 成功连接到ws服务!')
        z.proxy = new Proxy(ws)
        z.proxy.ready = true
      }
      ws.onmessage = e => {
        //   console.log(e)
        try {
          let ret = JSON.parse(e.data)
          let { cmd, data } = ret
          switch (cmd) {
            case 'list':
              // this.formatData(data.list)
              break
            case 'upload':
              // this.formatData(data.list)
              break
            case 'watch':
              // this.formatData(data.list)
              break
            case 'offwatch':
              // this.formatData(data.list)
              break
            default:
              alert('天啊, 你到底输入了啥命令?!')
          }
          this.formatData(data.list)
        } catch (e) {
          console.log(e)
        }
      }
      ws.onclose = () => (z.proxy.ready = false)
    },
    reConnect() {
      let z = this;
      if(z.ws && z.ws.readyState === 1) {
        z.ws.close();
      }
      z.connect();
    },
    formatData(list) {
      let z = this
      list.forEach(f => {
        z.preformatFile(f)
        switch (z.checkFileStatus(f)) {
          case 2:
            f.progress = 100
            z.setFileAsFinished(f)
            break
          case 1:
            if (f.progress > 99) {
              f.progress = 99
            }
            z.setFileAsToFinish(f)
            break
          case 0:
            z.setFileAsTrxing(f)
            break
          default:
            let msg = '错误的数据格式, file.status 错误'
            z.errors['data'].push(msg)
        }
      })
      return [
        ...Object.values(z.fileRecords),
        ...Object.values(z.fileRecordsToFinish),
        ...Object.values(z.fileRecordsTrxing)
      ]
    },
    checkFileStatus(file) {
      let { trxed, total, status } = file
      if (status === 2) {
        return 2 // done
      } else if (Math.floor(total - trxed) === 0) {
        return 1 // wait to finish
      } else {
        return 0 // transmitting
      }
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
    storeData() {
      let totalFiles = {
        fileRecords: z.fileRecords,
        fileRecordsToFinish: z.fileRecordsToFinish,
        fileRecordsTrxing: z.fileRecordsTrxing
      }
      if (z.checkStoreAvailable()) {
        z.store.setItem(JSON.stringify(totalFiles))
      }
    },
    restoreData() {
      let z = this
      if (z.checkStoreAvailable()) {
        let totalFiles = {}
        let storedData = z.store.getItem('totalFiles')
        if (storedData) {
          try {
            totalFiles = JSON.parse(storedData)
          } catch (e) {
            let msg = '读取历史记录出错, store 错误'
            console.log(msg)
            z.errors['store'].push(msg)
          }
        }
        z.fileRecords = totalFiles.fileRecords || {}
        z.fileRecordsToFinish = totalFiles.fileRecordsToFinish || {}
        z.fileRecordsTrxing = totalFiles.fileRecordsTrxing || {}
      }
    },
    setFileAsFinished(file) {
      //   if (this.fileRecordsTrxing[file.uid]) {
      //     delete this.fileRecordsTrxing[file.uid]
      //   } else if (this.fileRecordsToFinish[file.uid]) {
      //     delete this.fileRecordsToFinish[file.uid]
      //   }
      //   this.fileRecords[file.uid] = file
      //   Vue.set(this.fileRecords, file.uid, file)

      this.setFile(file, 'fileRecords')
    },
    setFileAsToFinish(file) {
      this.setFile(file, 'fileRecordsToFinish')
    },
    setFileAsTrxing(file) {
      this.setFile(file, 'fileRecordsTrxing')
    },
    setFile(file, category) {
      let z = this
      let categories = [
        'fileRecords',
        'fileRecordsToFinish',
        'fileRecordsTrxing'
      ]
      let dataHolder = z[category]
      if (dataHolder) {
        // Vue.set()
        // dataHolder[file.uid] = file
        z[category] = Object.assign({}, dataHolder, {
          [file.uid]: file
        })
      } else {
        z[category] = {
          [file.uid]: file
        }
      }
      let index = categories.indexOf(category)
      if (index > -1) {
        categories.splice(index, 1)
      }
      categories.forEach(cat => {
        if (z[cat] && z[cat][file.uid]) {
          delete z[cat][file.uid]
          z[cat] = Object.assign({}, z[cat])
        }
      })
    },
    preformatFile(file) {
      let progress = Math.floor((100 * file.trxed) / file.total)
      if (progress > 0 && progress <= 100) {
        file.progress = progress
      } else {
        file.progress = 0
      }
    },
    getFileRecords() {
      if (this.checkStoreAvailable()) {
        try {
          let stored = this.store.getItem('fileRecords')
          this.fileRecords = stored && JSON.parse(stored)
        } catch (e) {
          console.log(e)
          this.errors.push('Stored file list not available')
        }
      }
    },
    getFileRecordsToFinish() {
      if (this.checkStoreAvailable()) {
        try {
          let stored = this.store.getItem('fileRecordsToFinish')
          this.fileRecordsToFinish = stored && JSON.parse(stored)
        } catch (e) {
          console.log(e)
          this.errors.push('Stored file list not available')
        }
      }
    },
    getFileRecordsTrxing() {
      if (this.checkStoreAvailable()) {
        try {
          let stored = this.store.getItem('fileRecordsTrxing')
          this.fileRecordsTrxing = stored && JSON.parse(stored)
        } catch (e) {
          console.log(e)
          this.errors.push('Stored file list not available')
        }
      }
    },

    storeFileRecords() {
      if (this.checkStoreAvailable()) {
        this.store.setItem('fileRecords', JSON.stringify(this.fileRecords))
      }
    },
    storeFileRecordsToFinish() {
      if (this.checkStoreAvailable()) {
        this.store.setItem(
          'fileRecordsToFinish',
          JSON.stringify(this.fileRecordsToFinish)
        )
      }
    },
    storeFileRecordsTrxing() {
      if (this.checkStoreAvailable()) {
        this.store.setItem(
          'fileRecordsTrxing',
          JSON.stringify(this.fileRecordsTrxing)
        )
      }
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
      console.log('File(s) dropped')
      z.files = []
      event.preventDefault()
      event.stopPropagation()
      if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < event.dataTransfer.items.length; i++) {
          // If dropped items aren't files, reject them
          if (event.dataTransfer.items[i].kind === 'file') {
            console.log(event.dataTransfer.files[i])
            var file = event.dataTransfer.items[i].getAsFile()
            console.log('... file[' + i + '].name = ' + file.name)
            z.files.push({ origin: file.path }) //name: file.name,
            // z.files.push({ name: file.name, origin: file.path })
          }
        }
      } else {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < event.dataTransfer.files.length; i++) {
          console.log(
            '... file[' + i + '].name = ' + event.dataTransfer.files[i].name
          )
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
  border-radius: 1em;
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
  border-radius: 1em;
  margin-left: 0.5em;
}
aside {
  position: relative;
}
</style>
