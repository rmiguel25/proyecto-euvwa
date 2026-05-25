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
// --- 3. Vulnerabilidad: XSS Almacenado ---

// Simulamos una base de datos con un array (en memoria)
const comentarios = [];

// Ruta para mostrar la página de comentarios
app.get('/comentarios', (req, res) => {

    // Convertimos los comentarios en HTML para mostrarlos en pantalla
    // PROBLEMA: se insertan directamente sin ningún tipo de validación o limpieza
    // Esto permite que se ejecute código JavaScript si alguien introduce un script
    const listaComentarios = comentarios
        .map(c => `<li>${c}</li>`)
        .join('');

    res.send(`
        <h2>Libro de visitas (Vulnerable a Stored XSS)</h2>

        <form action="/comentarios" method="POST">
            <textarea name="nuevoComentario" placeholder="Escribe un comentario..."></textarea><br>
            <button type="submit">Enviar comentario</button>
        </form>

        <hr>

        <h3>Comentarios:</h3>
        <ul>
            ${listaComentarios}
        </ul>

        <br><a href="/">Volver al inicio</a>
    `);
});

// La ruta para guardar el comentario
app.post('/comentarios', (req, res) => {

    const texto = req.body.nuevoComentario;

    // Guardamos el comentario sin validarlo → aquí está la vulnerabilidad
    if (texto) {
        comentarios.push(texto);
    }

    // Redirigimos para mostrar la lista actualizada
    res.redirect('/comentarios');
});

// --- 4. Vulnerabilidad: Command Injection ---

// Importamos el módulo que permite ejecutar comandos del sistema
const { exec } = require('child_process');

// Ruta GET - > muestra el formulario
app.get('/ping', (req, res) => {
    res.send(`
        <h2>Herramienta de red: Ping (Vulnerable)</h2>

        <form action="/ping" method="POST">
            <label>IP o dominio:</label>
            <input type="text" name="ip" placeholder="127.0.0.1">
            <button type="submit">Hacer Ping</button>
        </form>

        <br><a href="/">Volver al inicio</a>
    `);
});

// La ruta POST -> ejecuta el comando
app.post('/ping', (req, res) => {
    const ip = req.body.ip;

    // El problema: se construye el comando usando directamente lo que introduce el usuario
    // Esto permite añadir comandos extra
    const comando = `ping -n 1 ${ip}`; // -n 1 para Windows

    console.log("Comando ejecutado:", comando);

    // Ejecutamos el comando en el sistema operativo
    exec(comando, (error, stdout, stderr) => {

        res.send(`
            <h2>Resultado del comando:</h2>
            <pre>${stdout}</pre>

            <br><a href="/ping">Volver</a>
        `);
    });
});
// --- 5. Vulnerabilidad: Insecure File Upload ---

// Importamos la librería multer para gestionar la subida de archivos
const multer = require('multer');

// Configuración básica: los archivos se guardan en la carpeta 'uploads'
const upload = multer({ dest: 'uploads/' });

// Ruta GET -> muestra el formulario de subida
app.get('/subir', (req, res) => {
    res.send(`
        <h2>Subida de archivos (Vulnerable)</h2>

        <!-- enctype es necesario para enviar archivos -->
        <form action="/subir" method="POST" enctype="multipart/form-data">
            <input type="file" name="archivo"><br><br>
            <button type="submit">Subir archivo</button>
        </form>

        <br><a href="/">Volver al inicio</a>
    `);
});

// Ruta POST -> recibe el archivo subido
app.post('/subir', upload.single('archivo'), (req, res) => {

    // Comprobamos si el usuario ha enviado un archivo
    if (!req.file) {
        return res.send("No se ha subido ningún archivo.");
    }

    // PROBLEMA: el archivo se guarda sin validar su tipo ni extensión
    // Esto permite subir archivos potencialmente maliciosos

    console.log("Archivo recibido:", req.file);

    res.send(`
        <h2>Archivo subido correctamente</h2>
        <p>Nombre original: <b>${req.file.originalname}</b></p>
        <p>Archivo guardado en el servidor sin validación.</p>

        <br><a href="/subir">Subir otro archivo</a>
    `);
});
// --- 6. Vulnerabilidad: Broken Authentication ---
// Necesario para poder leer los datos que vienen del formulario (POST)
app.use(express.urlencoded({ extended: true }));
// -------- HOME --------
app.get('/', (req, res) => {
    res.send('<h1>euVWA - versión vulnerable</h1>');
});
// -------- LOGIN VULNERABLE --------
// Formulario
app.get('/login2', (req, res) => {
    res.send(`
        <h2>Login (Vulnerable)</h2>
        <form method="POST" action="/login2">
            Usuario: <input type="text" name="username"><br>
            Password: <input type="text" name="password"><br>
            <button type="submit">Entrar</button>
        </form>
        <br><a href="/panel">Ir al panel</a>
    `);
});

// Login inseguro
app.post('/login2', (req, res) => {
    const user = req.body.username;
    const pass = req.body.password;

    // El problema: credenciales débiles y en texto plano
    if (user === "admin" && pass === "1234") {

        // El problema: cookie sencilla y manipulable
        res.setHeader('Set-Cookie', 'sesion_activa=admin');

        res.send("<h2>Acceso concedido</h2><p>Has entrado como administrador</p>");
    } else {
        res.send("<h2>Error de autenticación</h2>");
    }
});

// -------- PANEL (zona protegida pero mal hecha) --------
app.get('/panel', (req, res) => {

    // Leemos la cookie directamente
    const cookie = req.headers.cookie;

    // El problema: confiamos en la cookie sin validar nada
    if (cookie && cookie.includes('sesion_activa=admin')) {
        res.send("<h2>Panel de administrador</h2>");
    } else {
        res.send("No tienes acceso");
    }
});
// -------- SERVIDOR --------
//app.listen(3000, () => {
//    console.log("Servidor en http://localhost:3000");
//});
// --- 7. Vulnerabilidad: Security Misconfiguration ---

app.get('/config-rota', (req, res) => {
    try {
        // Simulamos  un fallo interno del servidor
        throw new Error("Error de conexión a base de datos interna (IP: 192.168.1.50)");

    } catch (error) {

        // El problem que mostramos información técnica interna al usuario
        res.status(500).send(`
            <h1>Error interno del servidor</h1>
            <p>Detalles técnicos:</p>

            <div style="background: #ffe6e6; padding: 15px; border: 2px solid red;">
                <pre>${error.stack}</pre>
            </div>

            <br><a href="/">Volver al inicio</a>
        `);
    }
});
// --- 8. Vulnerabilidad: Sensitive Data Exposure ---
// Simulación de base de datos
const usuariosBD = [
    { id: 1, username: "admin", password_en_claro: "SuperSecreta123", tarjeta: "4532-1111-2222-3333" },
    { id: 2, username: "alumno", password_en_claro: "aprobado5", tarjeta: "9999-8888-7777-6666" }
];
// APi vulnerable
app.get('/api/usuarios', (req, res) => {

    // PROBLEMA: se devuelven todos los datos sin filtrar información sensible
    res.json({
        estado: "OK",
        datos: usuariosBD
    });
});

// La página para acceder fácilmente
app.get('/perfiles', (req, res) => {
    res.send(`
        <h2>Directorio de usuarios (Vulnerable)</h2>
        <p>La API devuelve información completa de los usuarios:</p>
        <a href="/api/usuarios" target="_blank">Consultar API</a>
        <br><br><a href="/">Volver</a>
    `);
});