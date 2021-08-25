package server

import (
	"log"
	"net/http"
)

func main() {
	
	http.Handle("/", http.FileServer(http.Dir("./")))
	if err := http.ListenAndServeTLS(""); err != nil {
		log.Fatalln(err)
	}
}
