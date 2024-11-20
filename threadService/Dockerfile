FROM node

WORKDIR /src/app/threads

COPY package.json .

RUN npm install

COPY . .


EXPOSE 3004

CMD ["npm", "start"]