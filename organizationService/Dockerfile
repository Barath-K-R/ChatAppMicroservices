FROM node

WORKDIR /src/app/organization

COPY package.json .

RUN npm install

COPY . .


EXPOSE 3003

CMD ["npm", "start"]