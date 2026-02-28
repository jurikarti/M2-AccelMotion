// accel-web: streams Apple Silicon accelerometer data to a web browser via SSE.
// Must be run with sudo for IOKit HID access.
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/taigrr/apple-silicon-accelerometer/sensor"
	"github.com/taigrr/apple-silicon-accelerometer/shm"
)

// Event holds a generic SSE message.
type Event struct {
	Type string      `json:"type"` // "data" or "tap"
	Data interface{} `json:"data"`
}

// Sample holds a single accelerometer reading.
type Sample struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
	T int64   `json:"t"` // unix ms
}

// TapEvent holds info about detected taps.
type TapEvent struct {
	Count int    `json:"count"`
	Text  string `json:"text"` // "YES" or "NO"
}

var (
	mu      sync.RWMutex
	latest  Sample
	brokers []chan Event
)

func addBroker() chan Event {
	ch := make(chan Event, 64)
	mu.Lock()
	brokers = append(brokers, ch)
	mu.Unlock()
	return ch
}

func removeBroker(ch chan Event) {
	mu.Lock()
	defer mu.Unlock()
	for i, b := range brokers {
		if b == ch {
			brokers = append(brokers[:i], brokers[i+1:]...)
			close(ch)
			return
		}
	}
}

func broadcast(e Event) {
	mu.Lock()
	defer mu.Unlock()
	if e.Type == "data" {
		latest = e.Data.(Sample)
	}
	for _, ch := range brokers {
		select {
		case ch <- e:
		default:
		}
	}
}

func main() {
	if os.Geteuid() != 0 {
		log.Fatal("accel-web requires root: run with sudo")
	}

	accelRing, err := shm.CreateRing(shm.NameAccel)
	if err != nil {
		log.Fatalf("creating accel shm: %v", err)
	}
	defer accelRing.Close()
	defer accelRing.Unlink()

	sensorReady := make(chan struct{})
	sensorErr := make(chan error, 1)

	go func() {
		close(sensorReady)
		if err := sensor.Run(sensor.Config{
			AccelRing: accelRing,
			Restarts:  0,
		}); err != nil {
			sensorErr <- err
		}
	}()

	select {
	case <-sensorReady:
	case err := <-sensorErr:
		log.Fatalf("sensor error: %v", err)
	}
	time.Sleep(150 * time.Millisecond)

	// Tap detection and polling loop
	go func() {
		var lastTotal uint64
		var smoothX, smoothY, smoothZ float64
		first := true
		alpha := 0.15

		// Tap detection variables
		threshold := 0.05 // G change threshold for a tap
		lastMag := 0.0
		tapCooldown := 150 * time.Millisecond
		lastTapTime := time.Time{}
		tapCount := 0
		windowOpen := false
		windowDuration := 400 * time.Millisecond

		ticker := time.NewTicker(20 * time.Millisecond) // ~50 Hz
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				samples, newTotal := accelRing.ReadNew(lastTotal, shm.AccelScale)
				lastTotal = newTotal
				if len(samples) == 0 {
					continue
				}

				// Process recent samples for tap detection
				for _, s := range samples {
					curX, curY, curZ := float64(s.X), float64(s.Y), float64(s.Z)
					mag := curX*curX + curY*curY + curZ*curZ // magnitude squared is enough

					// Simple high-pass/derivative check
					diff := mag - lastMag
					if diff < 0 {
						diff = -diff
					}

					if diff > threshold && time.Since(lastTapTime) > tapCooldown {
						lastTapTime = time.Now()
						tapCount++
						windowOpen = true
						// fmt.Printf("Tap detected! Count: %d\n", tapCount)
					}
					lastMag = mag
				}

				// Global window logic to distinguish 1 vs 2 taps
				if windowOpen && time.Since(lastTapTime) > windowDuration {
					text := "YES"
					if tapCount >= 2 {
						text = "NO"
					}
					broadcast(Event{
						Type: "tap",
						Data: TapEvent{Count: tapCount, Text: text},
					})
					tapCount = 0
					windowOpen = false
				}

				// Standard smoothed data broadcast
				latestS := samples[len(samples)-1]
				curX, curY, curZ := float64(latestS.X), float64(latestS.Y), float64(latestS.Z)

				if first {
					smoothX, smoothY, smoothZ = curX, curY, curZ
					first = false
				} else {
					smoothX = alpha*curX + (1-alpha)*smoothX
					smoothY = alpha*curY + (1-alpha)*smoothY
					smoothZ = alpha*curZ + (1-alpha)*smoothZ
				}

				broadcast(Event{
					Type: "data",
					Data: Sample{
						X: smoothX,
						Y: smoothY,
						Z: smoothZ,
						T: time.Now().UnixMilli(),
					},
				})
			}
		}
	}()

	http.HandleFunc("/", serveIndex)
	http.HandleFunc("/events", serveSSE)
	http.HandleFunc("/latest", serveLatest)

	addr := ":8080"
	fmt.Printf("accel-web: listening on http://localhost%s\n", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}

func serveIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/" {
		http.ServeFile(w, r, "index.html")
		return
	}
	http.FileServer(http.Dir(".")).ServeHTTP(w, r)
}

func serveLatest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	mu.RLock()
	s := latest
	mu.RUnlock()
	json.NewEncoder(w).Encode(s)
}

func serveSSE(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	ch := addBroker()
	defer removeBroker(ch)

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case s, ok := <-ch:
			if !ok {
				return
			}
			data, _ := json.Marshal(s)
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}
