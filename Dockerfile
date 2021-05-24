FROM node:10

WORKDIR /problem
RUN yarn global add forever typescript@3.4

ADD yarn.lock ./
ADD package.json ./
ADD wasm/package.json ./wasm/package.json
ADD common/package.json ./common/package.json
ADD client/package.json ./client/package.json
ADD server/package.json ./server/package.json

RUN yarn install

ADD . ./

RUN make

EXPOSE 7744

CMD ["forever", "server/dist/index.js"]; 
