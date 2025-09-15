const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 3000;

// Servir archivos estáticos
app.use(express.static(__dirname + "/public"));

app.get('/', (req, res) => {
   res.sendFile(__dirname + "/public/index.html");
});

server.listen(port, () => {
  console.log("Servidor Express escuchando en http://localhost:" + port);
});

// Guardamos los usuarios registrados
let usuarios = {};

io.on("connection", (socket) => {
   console.log("un cliente se ha conectado", socket.id);

   // Registrar usuario
   socket.on("registrar_usuario", (nombre) => {
       usuarios[socket.id] = nombre;
       console.log(`Usuario registrado: ${nombre} (${socket.id})`);

       // Avisar a todos que se conectó
       io.emit("mensaje", ` ${nombre} se ha conectado`);
   });

   // Chat general
   socket.on("mensaje", (mensaje) => {
        const nombre = usuarios[socket.id] || "Anónimo";
        io.emit("mensaje", `${nombre}: ${mensaje}`);
   });

   // Desconexión
   socket.on("disconnect", () => {
       const nombre = usuarios[socket.id] || "Anónimo";
       io.emit("mensaje", ` ${nombre} se ha desconectado`);
       delete usuarios[socket.id];
   });
});
