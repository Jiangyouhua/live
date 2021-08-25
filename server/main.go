package main

import (
	"log"
	"net/http"
)

func main() {
	keyFile := "/Users/jiangyouhua/code/system/live/server/server.key"
	certFile := "/Users/jiangyouhua/code/system/live/server/server.crt"
	http.Handle("/", http.FileServer(http.Dir("./html/")))
	if err := http.ListenAndServeTLS(":443", certFile, keyFile, nil); err != nil {
		log.Fatalln(err)
	}
}