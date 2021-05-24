all: common wasm client server
.PHONY: common wasm client server docker

common:
	cd common && tsc

wasm:
	cd wasm && yarn run asbuild

client: common wasm
	cd client/js && npx webpack

server: common wasm
	cd server && tsc

docker:
	docker build . -t watness