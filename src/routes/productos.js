const ContenedorProductos = require("../controllers/contenedorProductos");

const {loggerError} = require("../utils/winston");

const Router = require("express").Router;
const routerProductos = Router();

const productos = new ContenedorProductos("./src/DB/productos.json");

routerProductos.get("/api/productos", async (req, res) => {
    res.status(200).send(await productos.getAll());
});

routerProductos.get("/api/productos/:id?", async (req, res) => {
    const id = req.params.id;
    const productoPorId = await productos.getById(Number(id));
    if (productoPorId !== null) return res.status(200).send(productoPorId);
    else {
        loggerError.log({
            level: "error",
            message: `Error Metodo: ${req.method} Producto ${id} no existe`,
        });
        return res.status(404).send(await productos.getAll());
    }
});

routerProductos.post("/api/productos", async (req, res) => {
    const producto = req.body;
    const producto_agregado = await productos.save(
        producto,
        (producto.codigo = Date.now()),
        (producto.timestamp = new Date().toISOString())
    );
    res.status(201).send(producto_agregado);
});

routerProductos.delete("/api/productos/:id", async (req, res) => {
    const id = req.params.id;
    const productoPorId = await productos.getById(Number(id));
    if (productoPorId !== null) {
        await productos.deleteById(Number(id));
        return res.status(201).send(`Producto ID: ${id} borrado`);
    } else {
        loggerError.log({
            level: "error",
            message: `Error Metodo: ${req.method} Producto ${id} no existe`,
        });
        return res.status(404).json(`ERROR Producto ID:${id} no encontrado`);
    }
});

// routerProductos.put("/api/productos/:id", async (req, res) => {
//     const id = req.params.id;
//     const exist = await productos.getById(id);
//     if (exist !== null) {
//         const { nombre, precio, foto, stock } = req.body;
//         const prod_editado = await productos.updateById(Number(id), {
//             nombre,
//             precio,
//             foto,
//             stock,
//         });
//         res.status(201).send(prod_editado);
//     } else res.status(404).json(`ERROR ID:${id} no encontrado`);
// });

module.exports = routerProductos;