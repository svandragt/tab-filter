.PHONY: check test lint build run clean

check: test lint

test:
	node test.js

lint:
	npx --yes web-ext lint

build: check
	npx --yes web-ext build --overwrite-dest

# Opens a fresh Firefox profile with the extension loaded; it reloads when files change.
run:
	npx --yes web-ext run

clean:
	rm -rf web-ext-artifacts
