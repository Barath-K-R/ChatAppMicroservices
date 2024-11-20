FROM node

WORKDIR /src/app/users

COPY package.json .

RUN npm install

COPY . .


EXPOSE 3005

CMD ["npm", "start"]