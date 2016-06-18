package main

import (
	"encoding/json"
	"fmt"
	"github.com/garyburd/redigo/redis"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	"regexp"
	"sort"
	"strconv"
)

const trackerPrefix = "TRACKER-ENTRY-"

func getKey(s string) string {
	return trackerPrefix + s
}

type optionalString struct {
	set bool
	string
}

func extractName(s string) optionalString {
	headPattern, tailPattern := "^\\[.*\\] ", " - \\d+.+$"
	match := regexp.MustCompile(headPattern + ".+" + tailPattern).MatchString(s)
	if !match {
		return optionalString{false, s}
	}
	repRem := func(fn func(a string, b string) string) func(x string) string {
		return func(x string) string {
			return fn(x, "")
		}
	}
	remHead := repRem(regexp.MustCompile(headPattern).ReplaceAllString)
	remRest := repRem(regexp.MustCompile(tailPattern).ReplaceAllString)
	return optionalString{true, remHead(remRest(s))}
}

// implement sort interface
type byDate []os.FileInfo

func (f byDate) Len() int {
	return len(f)
}
func (f byDate) Less(i, j int) bool {
	return f[i].ModTime().After(f[j].ModTime())
}
func (f byDate) Swap(i, j int) {
	f[i], f[j] = f[j], f[i]
}

func getNames() []string {
	files, err := ioutil.ReadDir(os.Getenv("ANIMU_HOME"))
	if err != nil {
		log.Fatal("animu home is missing or burning", err)
	}
	sort.Sort(byDate(files))
	var keys []string
	nmap := make(map[string]bool)
	for _, f := range files {
		name := extractName(f.Name())
		key := name.string
		if name.set && !nmap[key] {
			nmap[key] = true
			keys = append(keys, key)
		}
	}
	return keys
}

func seedDB(pool *redis.Pool, names []string) {
	fmt.Println("Seeding DB")
	for _, name := range names {
		c := pool.Get()
		key := getKey(name)
		c.Do("SETNX", key, 0)
	}
}

func getData(pool *redis.Pool, names []string) []map[string]string {
	data := make([]map[string]string, len(names))
	c := pool.Get()
	for i, name := range names {
		key := getKey(name)
		count, err := redis.Int(c.Do("GET", key))
		if err != nil {
			log.Fatal("redis get is broken")
		}
		entry := make(map[string]string)
		entry["name"] = name
		entry["count"] = strconv.Itoa(count)
		data[i] = entry
	}
	return data
}

func handleHome(pool *redis.Pool, names []string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
		}
		layout := path.Join("templates", "layout.html")
		index := path.Join("templates", "index.html")
		template, err := template.ParseFiles(layout, index)
		if err != nil {
			log.Fatal("template is broken", err)
		}
		data := getData(pool, names)
		json, err := json.Marshal(data)
		if err != nil {
			log.Fatal("JSON marshalling blew up somehow")
		}
		template.ExecuteTemplate(w, "layout", string(json))
	}
}

func handleCommandRequest(command string, pool *redis.Pool) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		err := r.ParseForm()
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, "Error")
		}
		name := r.Form.Get("name")
		key := getKey(name)
		c := pool.Get()
		res, err := c.Do(command, key)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, "Error")
		} else {
			fmt.Fprint(w, res)
		}
	}
}

func main() {
	names := getNames()
	fmt.Println(fmt.Sprintf("Got %s names from animu home", strconv.Itoa(len(names))))

	pool := &redis.Pool{
		Dial: func() (redis.Conn, error) {
			return redis.Dial("tcp", ":6379")
		},
	}
	defer pool.Close()

	seedDB(pool, names)

	addr := "localhost:1234"
	dir := http.Dir("web/dist/")

	fmt.Println("Initializing Handlers")
	http.Handle("/dist/", http.StripPrefix("/dist/", http.FileServer(dir)))
	http.HandleFunc("/increment", handleCommandRequest("INCR", pool))
	http.HandleFunc("/decrement", handleCommandRequest("DECR", pool))
	http.HandleFunc("/", handleHome(pool, names))
	http.ListenAndServe(addr, nil)
}
