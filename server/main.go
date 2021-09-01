package main

import (
	"flag"
	"log"
	"net/http"
	"server/socket"
)

const (
	keyFile  = "/etc/letsencrypt/live/muutr.com/privkey.pem"   // "/Users/jiangyouhua/code/system/live/server/server.key"
	certFile = "/etc/letsencrypt/live/muutr.com/fullchain.pem" // "/Users/jiangyouhua/code/system/live/server/server.crt"
)

var (
	hub *socket.Hub
)

func main() {
	flag.Parse()

	hub = socket.NewHub()
	go hub.Run()

	// 分开处理webSocket、site。
	http.HandleFunc("/", webSite)
	http.HandleFunc("/ws", webSocket)

	if err := http.ListenAndServeTLS(":443", certFile, keyFile, nil); err != nil {
		log.Fatalln(err)
	}
}

func webSite(w http.ResponseWriter, r *http.Request) {
	p := "." + r.URL.Path
	if p == "./" {
		p = "./site/chat.html"
	}
	http.ServeFile(w, r, p)
}

func webSocket(w http.ResponseWriter, r *http.Request) {
	log.Println("socket", r.URL)
	socket.ServeWs(hub, w, r)
}
