/// chat.js
(function () {
    // 判断是否支持WebSocket，不支持则退。
    if (!window["WebSocket"]) {
        console.log('Does not support websocket.')
        return
    }

    let configuration = {}
    let localClient = document.getElementById("localClient")
    let remoteClient = document.getElementById("remoteClient")
    const offerOptions = { offerToReceiveAudio: 1, offerToReceiveVideo: 1 }
    let localStream
    let pc

    /** WebSocket **/

    // 建立WebSocket连接。
    let ws = new WebSocket("wss://" + document.location.host + "/ws")
    // 关闭连接。
    ws.onclose = function (evt) {
        console.log('Connection closed.')
    }
    // 接收信息。
    ws.onmessage = function (evt) {
        let msg = JSON.parse(evt.data)
        if (!msg) {
            return console.log('failed to parse msg')
        }
        switch (msg.event) {
            case 'offer':
                return toAnswer(msg.data)
            case 'answer':
                return toFinish(msg.data)
            case 'candidate':
                return candidate(msg.data)
        }
    }

    // 发送信息。
    function wsSend(event, data) {
        ws.send(JSON.stringify({ event: event, data: JSON.stringify(data) }))
    }

    /** WebRTC **/

    // 以提供者的身份，开始对接。
    function startAndOffer() {
        pc = RTCPeerConnection(configuration)
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream))
        pc.onicecandidate = function (event) {
            wsSend("candidate", event.candidate)
        }
        pc.createOffer(offerOptions).then(offer => {
            // 5. AC调用`setLocalDescription()` 将`offer`设置为本地描述。
            pc.setLocalDescription(offer)
            wsSend(jsonString('offer', offer))
        })
    }

    // 以提供者的身份，完成对接。
    function endWithOffer(data) {
        let answer = JSON.parse(data)
        if (!answer) {
            return console.log('failed to parse answer')
        }
        pc.setRemoteDescription(answer)
    }

    // 接收媒体。
    pc.ontrack = function (event) {
        remoteClient.srcObject = event.streams[0]
    }

    // 发送媒体。
    // 2. A通过`navigator.mediaDevices.getUserMedia()` 捕捉本地媒体。
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(function (stream) {
            localClient.srcObject = stream
            localStream = stream
        }).catch(function (err) {
            console.log("An error occurred: " + err);
        })


    /** Received From WebSocket */
    function receivedCandidate(data) {
        let candidate = JSON.parse(data)
        if (!candidate) {
            return console.log('failed to parse candidate')
        }
        pc.addIceCandidate(candidate)
    }

    function receivedOffer(data) {
        pc.createAnswer().then(answer => {
            pc.setRemoteDescription(data)
            pc.setLocalDescription(answer)
            wsSend("answer", answer)
        })
    }

    function receivedAnswer(data) {
        pc.setRemoteDescription(data)
    }
})()
