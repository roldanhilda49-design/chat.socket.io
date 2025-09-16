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
  console.log(`Servidor Express escuchando en http://localhost:${port}`);
});

// Guardamos usuarios
let usuarios = {};

io.on("connection", (socket) => {
   console.log("Un cliente conectado:", socket.id);

   // Registrar usuario
   socket.on("registrar_usuario", (nombre) => {
       usuarios[socket.id] = nombre;
       console.log(`Usuario registrado: ${nombre} (${socket.id})`);

       // Avisar a todos
       io.emit("mensaje", `${nombre} se ha conectado`);
       io.emit("lista_usuarios", Object.values(usuarios));
   });

   // Chat general
   socket.on("mensaje", (mensaje) => {
        const nombre = usuarios[socket.id] || "Anónimo";
        io.emit("mensaje", `${nombre}: ${mensaje}`);
   });

   // Chat privado
   socket.on("mensaje_privado", ({para, mensaje}) => {
        const nombre = usuarios[socket.id] || "Anónimo";
        const idDestino = Object.keys(usuarios).find(key => usuarios[key] === para);

        if(idDestino){
            io.to(idDestino).emit("mensaje_privado", {de: nombre, mensaje});
            socket.emit("mensaje_privado", {de: "Tú", mensaje: mensaje});
        }
   });

   // Desconexión
   socket.on("disconnect", () => {
       const nombre = usuarios[socket.id] || "Anónimo";
       io.emit("mensaje", `${nombre} se ha desconectado`);
       delete usuarios[socket.id];
       io.emit("lista_usuarios", Object.values(usuarios));
   });
});
