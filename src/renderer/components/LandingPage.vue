<template>
    <div id="wrapper">
        <!-- <img id="logo" src="~@/assets/logo.png" alt="electron-vue"> -->
        <main>
            <div>
                <button class="alt" @click="openFile()">Open</button>
                <button class="alt" @click="saveFile()">Save</button>
                <!-- <button class="alt" @click="showOpenGoDialog()">OpenGo</button>
                <button class="alt" @click="showSaveGoDialog()">SaveGo</button>-->
                <button class="alt" @click="list()">List</button>
                <button class="alt" @click="watchit()">Watch</button>
                <button class="alt" @click="offwatchit()">Stop Watching</button>
            </div>
            <div class="doc" v-show="filedata.length > 0">
                <p ref="data">{{filedata}}</p>
            </div>
            <p>
                <label for="message">message:</label>
                <input type="text" name="message" id="messageInput">
                <input type="submit" value="Send" id="submit">
            </p>
            <p>
                <label for="cmd">Commands</label>
                <select name="cmd" id="cmdSelect">
                    <option value="watch">watch</option>
                    <option value="offwatch">offwatch</option>
                    <option value="trans">trans</option>
                    <option value="close">close</option>
                </select>
            </p>
            <div class="dropzone" @drop="drop" @dragover="dragover"></div>
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

button {
    font-size: 0.8em;
    cursor: pointer;
    outline: none;
    min-width: 6em;
    padding: 0.45em 1em;
    border-radius: 1em;
    display: inline-block;
    color: #fff;
    background-color: #4fc08d;
    transition: all 0.15s ease;
    box-sizing: border-box;
    border: 1px solid #4fc08d;
}
button.alt {
    color: #42b983;
    background-color: transparent;
}
.dropzone {
    min-height: 400px;
    background-color: antiquewhite;
    border: 1px solid #678628;
}
</style>
