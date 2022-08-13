const Router = require('express').Router;
const  {createFakeProducts}  = require('../controllers/contenedorProductos.js');

const routerProducto = Router();

routerProducto.get("/productos-test", async (req, res) => {
    const productos = await createFakeProducts();
    if (productos.length > 0) res.status(200).send(productos);
    else res.status(404).send("No se encontraron productos");
});


module.exports = routerProducto;