// app.js - archivo principal donde se levanta el servidor
const express = require('express');
const app = express();

// Para poder recoger datos enviados desde formularios
app.use(express.urlencoded({ extended: true }));

// Para trabajar también con JSON (lo necesitaremos más adelante)
app.use(express.json());

app.get('/', (req, res) => {
    res.send('<h1>euVWA - versión vulnerable</h1><p>Aplicación lista para pruebas</p>');
});
// Formulario de login - Simulado
app.get('/login', (req, res) => {
    res.send(`
        <h2>Login</h2>
        <form method="POST" action="/login">
            Usuario: <input type="text" name="username" /><br/>
            Password: <input type="text" name="password" /><br/>
            <button type="submit">Entrar</button>
        </form>
    `);
});

// LOGIN vulnerable - simulación de SQL Injection 
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // La construcción insegura de la Query
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    console.log("Query ejecutada:", query);

    // Simulación de bypass
    if (username.includes("' OR 1=1")) {
        res.send("<h1>Login exitoso (SQL Injection)</h1>");
    } else {
        res.send("<h1>Credenciales incorrectas</h1>");
    }
});
app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});
// Vulnerabilidad:  XSS reflejado en un buscador.
app.get('/buscador', (req, res) => {
    // El parámetro de búsqueda desde la URL ?q=...
    const busqueda = req.query.q || '';

    // Insertamos en el HTML pero sin escapar -> XSS reflejado.
    res.send(`
        <h2>Buscador euVWA</h2>
        <form action="/buscador" method="GET">
            <input type="text" name="q" placeholder="Busca algo..." value="${busqueda}">
            <button type="submit">Buscar</button>
        </form>
        <hr>
        <p>Resultados para: ${busqueda}</p>
        <br>
        <a href="/">Volver al inicio</a>
    `);
});