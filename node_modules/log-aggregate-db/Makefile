default: test

node_modules: package.json
	npm install

cookbooks: Berksfile
	berks install --path cookbooks

.PHONY: test
test: node_modules
	./node_modules/.bin/mocha $(wildcard *_test.js)
