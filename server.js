require('dotenv').config();

const express = require('express');
const { Server: HttpServer } = require('http');
const { Server: IOServer } = require('socket.io');

const { engine } = require('express-handlebars');

const routerProducto = require('./src/routes/routes-faker-productos.js');
const ContenedorMensajes = require('./src/controllers/contenedorMensajes.js');


const {allNormalizeProcess} = require('./src/controllers/normalizr.js');


const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');


const yargArgs = require('./src/routes/yarg-cli.js');
const cluster = require('cluster');
const os = require('os');


const routerAll = require('./src/routes/router.js')
const routerRandomNums = require('./src/routes/forked/fork-random-nums.js');
const routerInfo = require('./src/routes/info.js');
const compression = require('compression');


const app = express();
const httpServer = new HttpServer(app)
const ioServer = new IOServer(httpServer)

const mensajes = new ContenedorMensajes('./src/DB/mensajes.json');

app.use(compression())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));
app.engine(
	'hbs',
	engine({
	  extname: '.hbs',
	  defaultLayout: 'main.hbs',
	})
);

app.set('views', './public/views');
app.set('view engine', 'hbs');


app.use(cookieParser());

app.use(
	session({
		store: MongoStore.create({
			mongoUrl:process.env.MONGO_ATLAS_URL,
			mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
		}),
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: true,
		rolling: true,
		cookie: {
			maxAge: 1000 * 60 * 10,
		},
	})
);


app.use('/api', routerProducto)

app.use(routerAll);

app.use('/info', routerInfo);


app.use('/api/randoms', routerRandomNums);


ioServer.on("connection", async (socket) => {
	console.log("Nuevo usuario conectado");
	
	socket.emit("messages", allNormalizeProcess(await mensajes.getAll()));
  
	socket.on("new-message", async (msj) => {
		await mensajes.save(msj);
		allNormalizeProcess(await mensajes.getAll()),
		
			ioServer.sockets.emit("messages",
				allNormalizeProcess(await mensajes.getAll())
			);
	});
});


// Ataja los errores de passport
app.use((error, req, res, next) => {
	res.status(500).send(error.message);
});

app.use((req, res) => {
	res.status(404).send({
		error: -2,
		descripcion: `ruta ${req.originalUrl} y metodo ${req.method} no implementada`,
	});
});


const PORT = yargArgs.puerto;
const MODO = yargArgs.modo;
const nroCPUs = os.cpus().length;


if (MODO !== 'FORK' && MODO !== 'CLUSTER') {
    throw new Error(`MODO: ${MODO} no implementado, use "FORK" o "CLUSTER"`);
};

if (MODO == 'CLUSTER') {
    if (cluster.isPrimary) {
        for (let i = 0; i < nroCPUs; i++) {
            cluster.fork()
        }
		console.log(`Primary PID: ${process.pid} - PORT: ${PORT} - MODO: ${MODO} - isPrimary: ${cluster.isPrimary} - Number of CPUs: ${nroCPUs}\n`);
		cluster.on("online", (worker) => { console.log(`Worker PID: ${worker.process.pid} is alive!`);});
    	cluster.on("exit", (worker) => { console.log(`Worker ${worker.process.pid} died`);});
    } else {
        httpServer.listen(PORT, () => { console.log(`Escuchando en el Puerto: ${httpServer.address().port} - MODO: ${MODO} - Worker: ${cluster.worker.id} - Wk_PID: ${cluster.worker.process.pid}`);});
        httpServer.on("error", (error) => console.error("Error de conexión", error));
    }
};
if (MODO == 'FORK'){
	httpServer.listen(PORT, () => {
		console.log(`Escuchando en el Puerto: ${httpServer.address().port} - MODO: ${MODO} - PID: ${process.pid}`);
	});
	httpServer.on("error", (error) => console.error(error, "Error de conexión"));
};
