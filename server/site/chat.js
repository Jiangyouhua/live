/// chat.js
window.onload = function () {
    // 判断是否支持WebSocket，不支持则退。
    if (!window["WebSocket"]) {
        console.log('Does not support websocket.')
        return
    }


    let configuration = {}
    let connectionInfo = document.getElementById("connectionInfo")
    let localClient = document.getElementById("localClient")
    let remoteClient = document.getElementById("remoteClient")
    let testButton = document.getElementById("testButton")
    let startButton = document.getElementById("startButton")
    let endButton = document.getElementById("endButton")

    let pc  // 当前客户端。
    let localStream   // 本地媒体。

    /** WebSocket **/

    // 建立WebSocket连接。
    let ws = new WebSocket("wss://" + document.location.host + "/ws")
    // 关闭连接。
    ws.onclose = function (event) {
        console.log('Connection closed.')
    }
    // 接收信息。
    ws.onmessage = function (event) {
        let msg = JSON.parse(event.data)
        if (!msg) {
            return console.log('WebSocket.onmessage is error')
        }
        switch (msg.type) {
            case 'offer':
                return receivedOffer(msg.data)
            case 'answer':
                return receivedAnswer(msg.data)
            case 'candidate':
                return receivedCandidate(msg.data)
            default:
                connectionInfo.innerText = msg.data
        }
    }

    // 发送信息。
    function wsSend(key, data) {
        ws.send(JSON.stringify({key: key, data: data}))
    }

    /** Button Event */

    // 测试 WebSocket。
    testButton.addEventListener('click', function (e) {
        wsSend('info', 'Welcome to webRTC.' )
    })

    // 开始 WebRTC。
    startButton.addEventListener('click', function (e) {
        pc.createOffer().then(offer => {
            // 5. AC调用`setLocalDescription()` 将`offer`设置为本地描述。
            pc.setLocalDescription(offer)
            pc.onicecandidate = event => { wsSend('candidate', event.candidate)}
            // wsSend('offer', offer)
        }).catch(error => {
            console.log("startButton.click pc.createOffer: " + error)
        })
    })

    // 结束 WebRTC.
    endButton.addEventListener('click', function (e) {
        pc.close()
    })


    /** WebRTC **/

    // 作连接前准备。
    function beforeConnection() {
        pc = new RTCPeerConnection()
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream))
        // 接收媒体。
        pc.ontrack = function (event) {
            remoteClient.srcObject = event.streams[0]
        }
    }

    // 发送媒体。
    // 2. A通过`navigator.mediaDevices.getUserMedia()` 捕捉本地媒体。
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(function (stream) {
            localClient.srcObject = stream
            localStream = stream
            beforeConnection()
        }).catch(error => {
            console.log("Root getUserMedia: " + error);
        })


    /** Received From WebSocket */
    function receivedCandidate(data) {
        pc.addIceCandidate(candidate)
    }

    function receivedOffer(data) {
        // PeerConnection cannot create an answer in a state other than have-remote-offer or have-local-pranswer.
        if (pc.signalingState != "have-remote-offer" || pc.signalingState != "have-local-pranswer") {
            return
        }
        pc.createAnswer().then(answer => {
            pc.setRemoteDescription(data)
            pc.setLocalDescription(answer)
            wsSend('answer', answer)
        }).catch(error => {
            console.log("ReceivedOffer pc.createAnswer: " + error)
        })
    }

    function receivedAnswer(data) {
        if (pc.signalingState != "offer") {
            return
        }
        pc.setRemoteDescription(data)
    }
}
