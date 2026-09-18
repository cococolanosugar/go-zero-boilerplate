package jenkins

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestJenkinsClientFlow(t *testing.T) {
	mux := http.NewServeMux()

	// 1. Crumb issuer
	mux.HandleFunc("/crumbIssuer/api/json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"crumbRequestField":"Jenkins-Crumb","crumb":"mock-crumb-12345"}`)
	})

	// 2. Ping / Connection test
	mux.HandleFunc("/api/json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Jenkins", "2.440.1")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, `{"mode":"NORMAL"}`)
	})

	// 3. Trigger Job
	mux.HandleFunc("/job/my-service-build/buildWithParameters", func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Jenkins-Crumb") != "mock-crumb-12345" {
			http.Error(w, "missing crumb", http.StatusForbidden)
			return
		}
		if r.URL.Query().Get("BRANCH") != "release/v1.0" {
			http.Error(w, "invalid branch param", http.StatusBadRequest)
			return
		}
		w.Header().Set("Location", "http://jenkins/queue/item/99/")
		w.WriteHeader(http.StatusCreated)
	})

	// 4. Query Queue Item
	mux.HandleFunc("/queue/item/99/api/json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"id":99,"blocked":false,"executable":{"number":12,"url":"http://jenkins/job/my-service-build/12/"}}`)
	})

	// 5. Query Build Info
	mux.HandleFunc("/job/my-service-build/12/api/json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"id":"12","number":12,"building":false,"result":"SUCCESS","duration":15200}`)
	})

	// 6. Progressive Log
	mux.HandleFunc("/job/my-service-build/12/logText/progressiveText", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Text-Size", "45")
		w.Header().Set("X-More-Data", "false")
		fmt.Fprint(w, "[INFO] Build completed successfully. Image pushed.\n")
	})

	server := httptest.NewServer(mux)
	defer server.Close()

	client := NewClient(Config{
		URL:      server.URL,
		Username: "admin",
		Token:    "mock-token",
	})

	ctx := context.Background()

	// Test 1: Connection
	version, err := client.TestConnection(ctx)
	if err != nil {
		t.Fatalf("TestConnection failed: %v", err)
	}
	if version != "2.440.1" {
		t.Fatalf("expected version 2.440.1, got %s", version)
	}

	// Test 2: Trigger Job with Params
	queueID, err := client.TriggerJob(ctx, "my-service-build", map[string]string{
		"BRANCH": "release/v1.0",
	})
	if err != nil {
		t.Fatalf("TriggerJob failed: %v", err)
	}
	if queueID != 99 {
		t.Fatalf("expected queueID 99, got %d", queueID)
	}

	// Test 3: Query Queue Item
	item, err := client.GetQueueItem(ctx, queueID)
	if err != nil {
		t.Fatalf("GetQueueItem failed: %v", err)
	}
	if item.Executable.Number != 12 {
		t.Fatalf("expected executable build number 12, got %d", item.Executable.Number)
	}

	// Test 4: Query Build Info
	info, err := client.GetBuildInfo(ctx, "my-service-build", item.Executable.Number)
	if err != nil {
		t.Fatalf("GetBuildInfo failed: %v", err)
	}
	if info.Result != "SUCCESS" || info.Building {
		t.Fatalf("expected completed SUCCESS, got %+v", info)
	}

	// Test 5: Progressive Log
	logResp, err := client.GetProgressiveLog(ctx, "my-service-build", item.Executable.Number, 0)
	if err != nil {
		t.Fatalf("GetProgressiveLog failed: %v", err)
	}
	if logResp.NextOffset != 45 || logResp.HasMore {
		t.Fatalf("unexpected log response: %+v", logResp)
	}
}
