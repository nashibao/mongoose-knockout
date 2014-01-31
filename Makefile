
build: components index.coffee
	@echo building
	coffee --compile --bare index.coffee
	coffee --compile --bare storage.coffee
	coffee --compile --bare adapter/socket.coffee
	coffee --compile --bare adapter/rest.coffee
	coffee --compile --bare adapter/index.coffee
	@component build --dev

install: components build/build.js
	 component build --standalone mk --out . --name mk

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js index.js mk.js

.PHONY: clean
