import app from "./app";
import http from "http";
import { socketService } from "./services/socketService";

const server = http.createServer(app);
socketService(server);

const PORT: number = Number(process.env.PORT) || 3000;

server.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
