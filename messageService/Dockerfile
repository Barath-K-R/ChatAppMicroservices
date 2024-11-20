FROM node

WORKDIR /src/app/messages

COPY package.json .

RUN npm install

COPY . .


EXPOSE 3002

CMD ["npm", "start"]