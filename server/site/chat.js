/// chat.js
(function () {
    // 判断是否支持WebSocket，不支持则退。
    if (!window["WebSocket"]) {
        console.log('Does not support websocket.')
        return
    }

    let localClient = document.getElementById("localClient")
    let remoteClient = document.getElementById("remoteClient")

    /** WebSocket **/

    let ws = new WebSocket("wss://" + document.location.host + "/ws")
    ws.onclose = function (evt) {
        console.log('Connection closed.')
    }
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

    function wsSend(event, data) {
        ws.send(JSON.stringify({event: event, data: JSON.stringify(data)}))
    }

    /** WebRTC **/

    let pc = new RTCPeerConnection({
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302'
            }
        ]
    })

    pc.ontrack = function (event) {
        if (event.track.kind === 'audio') {
            return
        }

        let el = document.createElement(event.track.kind)
        el.srcObject = event.streams[0]
        el.autoplay = true
        el.controls = true
        remoteClient.appendChild(el)

        event.track.onmute = function (event) {
            el.play()
        }

        event.streams[0].onremovetrack = ({track}) => {
            if (el.parentNode) {
                el.parentNode.removeChild(el)
            }
        }
    }

    // 从摄像头、麦克风中获取本地媒体。
    navigator.mediaDevices.getUserMedia({video: true, audio: false})
        .then(function (stream) {
            // 本地视频。
            localClient.srcObject = stream
            video.play()
            // 发送到远端。
            stream.getTracks().forEach(track => pc.addTrack(track, stream))
        }).catch(function (err) {
        console.log("An error occurred: " + err);
    });



    function candidate(data) {
        let candidate = JSON.parse(data)
        if (!candidate) {
            return console.log('failed to parse candidate')
        }
        pc.addIceCandidate(candidate)
    }

    function toOffer() {
        pc.createOffer().then(offer => {
            pc.setLocalDescription(offer)
            wsSend(jsonString('offer', offer))
        })
    }

    function toAnswer(data) {
        let offer = JSON.parse(data)
        if (!offer) {
            return console.log('failed to parse answer')
        }
        pc.setRemoteDescription(offer)
        pc.createAnswer().then(answer => {
            pc.setLocalDescription(answer)
            wsSend('answer', data)
        })
    }

    function toFinish(data) {
        let answer = JSON.parse(data)
        if (!answer) {
            return console.log('failed to parse answer')
        }
        pc.setRemoteDescription(answer)
    }

})()

