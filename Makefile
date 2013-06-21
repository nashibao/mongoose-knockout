
build: components index.coffee
	@echo building
	coffee --compile --bare index.coffee
	@component build --dev

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js index.js

.PHONY: clean
