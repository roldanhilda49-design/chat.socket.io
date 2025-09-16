const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexiones desde cualquier origen
    methods: ["GET", "POST"]
  }
});

// Puerto dinámico para Render
const port = process.env.PORT || 3000;

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Guardar usuarios conectados
let usuarios = {};

io.on("connection", (socket) => {
   console.log("Cliente conectado:", socket.id);

   // Registrar usuario
   socket.on("registrar_usuario", (nombre) => {
       usuarios[socket.id] = nombre;
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
           socket.emit("mensaje_privado", {de: "Tú", mensaje});
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

// Escuchar puerto
server.listen(port, () => {
   console.log(`Servidor escuchando en el puerto ${port}`);
});
