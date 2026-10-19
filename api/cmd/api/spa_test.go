package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func buildDir(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	files := map[string]string{
		"index.html": "<html><title>tools.xdoubleu.com</title></html>",
		"sw.js":      "(function(){})(self, __OFFLINE_ENABLED__, []);",
	}
	for name, body := range files {
		require.NoError(t, os.WriteFile(filepath.Join(dir, name), []byte(body), 0o600))
	}
	return dir
}

func TestHandler_WithoutWebDirIsJustTheAPI(t *testing.T) {
	original := testApp.config.WebDir
	testApp.config.WebDir = ""
	t.Cleanup(func() { testApp.config.WebDir = original })

	h, err := testApp.Handler()
	require.NoError(t, err)

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/api/version", nil))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), `"release"`)

	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/books/library", nil))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestHandler_WithWebDirServesTheAppAndStillStripsAPI(t *testing.T) {
	original := testApp.config
	testApp.config.WebDir = buildDir(t)
	testApp.config.OfflineDisabled = true
	t.Cleanup(func() { testApp.config = original })

	h, err := testApp.Handler()
	require.NoError(t, err)

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/books/library", nil))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "<title>")

	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/sw.js", nil))
	assert.Contains(t, rec.Body.String(), "(self, false,")

	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/api/version", nil))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), `"release"`)

	// Internal-only /metrics stays unreachable through the public /api prefix.
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/metrics", nil))
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestHandler_FailsWhenTheBuildIsMissing(t *testing.T) {
	original := testApp.config.WebDir
	testApp.config.WebDir = t.TempDir()
	t.Cleanup(func() { testApp.config.WebDir = original })

	_, err := testApp.Handler()

	require.Error(t, err)
}
