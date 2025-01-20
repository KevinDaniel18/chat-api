const app = require("./app");
const http = require("http");
const { socketService } = require("./services/socketService");

const server = http.createServer(app)
socketService(server)

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Running on port ${PORT}`)
});
