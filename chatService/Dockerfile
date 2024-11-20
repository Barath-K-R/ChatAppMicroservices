FROM node

WORKDIR /src/app/chats

COPY package.json .

RUN npm install

COPY . .


EXPOSE 3001

CMD ["npm", "start"]