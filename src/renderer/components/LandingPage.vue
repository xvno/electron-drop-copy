<template>
    <div id="wrapper">
        <!-- <img id="logo" src="~@/assets/logo.png" alt="electron-vue"> -->
        <main>
            <el-container>
                <el-header>
                    <el-button type="primary" round @click="openFile()">Open</el-button>
                    <el-button type="success" round @click="saveFile()">Save</el-button>
                    <el-button type="info" round @click="list()">List</el-button>
                    <el-button type="warning" round @click="watchit()">Watch</el-button>
                    <el-button type="danger" round @click="offwatchit()">Stop Watching</el-button>
                </el-header>
                <el-container>
                    <el-aside width="200px">
                        <div
                            class="grid-content bg-purple dropzone"
                            @drop="drop"
                            @dragover="dragover"
                        ></div>
                    </el-aside>
                    <el-container>
                        <el-main>
                            <div class="doc" v-show="filedata.length > 0">
                                <p ref="data">{{filedata}}</p>
                            </div>
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

// import { dropHandler, ondragoverHandler } from 'api/due'

export default {
    name: 'landing-page',
    components: { SystemInformation },
    data() {
        return {
            name: '',
            filedata: '',
            files: [],
            ws: null,
            proxy: null
        }
    },
    created() {
        let z = this
        z.name = une.getName()
        let ws = (z.ws = new WebSocket('ws://localhost:3333/ws'))
        console.log(Proxy)
        ws.onopen = function(e) {
            console.log('onopen')
            z.proxy = new Proxy(ws)
            z.proxy.ready = true
        }
        ws.onmessage = e => {
            console.log(e)
            try {
                let data = JSON.parse(e.data)
                console.log(data)
            } catch (e) {
                console.log(e)
            }
        }
        ws.onclose = () => (z.proxy.ready = false)
    },
    methods: {
        open(link) {
            this.$electron.shell.openExternal(link)
        },
        openFile() {
            console.log('showOpenDialog')
            let z = this
            une.openFile(function(data) {
                z.filedata = data
            })
        },
        saveFile() {
            console.log('showSaveDialog')
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
                        z.files.push({ name: file.name, origin: file.path })
                    }
                }
            } else {
                // Use DataTransfer interface to access the file(s)
                for (var i = 0; i < event.dataTransfer.files.length; i++) {
                    console.log(event.dataTransfer.files[i])
                    console.log(
                        '... file[' +
                            i +
                            '].name = ' +
                            event.dataTransfer.files[i].name
                    )
                    z.files.push({ name: file.name, origin: file.path })
                }
            }
            if (z.files.length > 0) {
                // une.sendCmd(this.files)
                // upload(this.files, this.ws)
                z.proxy.send('upload', {
                    list: z.files
                })
                // console.log(z.proxy)
            }
        },
        dragover(event) {
            console.log('File(s) in drop zone')
            // Prevent default behavior (Prevent file from being opened)
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
