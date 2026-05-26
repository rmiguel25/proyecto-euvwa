// app.js Seguro - archivo principal donde se levanta el servidor
const express = require('express');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;
require('dotenv').config();
const app = express();
app.use(express.urlencoded({ extended: true }));
const multer = require('multer');  
const crypto = require('crypto');


// Función para limpiar lo que mete el usuario y evitar XSS
function escapeHTML(texto) {
    if (!texto) return '';
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// --- XSS reflejado corregido ---
app.get('/buscador', (req, res) => {
    // Cogemos lo que viene en la URL (?q=...)
    const busquedaRaw = req.query.q || '';

    // Lo limpiamos para que no se ejecute código raro
    const busquedaSegura = escapeHTML(busquedaRaw);

    res.send(`
        <h2>Buscador euVWA</h2>
        <form action="/buscador" method="GET">
            <!-- Aquí usamos el valor ya limpio -->
            <input type="text" name="q" placeholder="Busca algo..." value="${busquedaSegura}">
            <button type="submit">Buscar</button>
        </form>
        <hr>

        <!-- Mostramos el resultado ya sanitizado -->
        <p>Resultados para: ${busquedaSegura}</p>

        <br>
        <a href="/">Volver al inicio</a>
    `);
});

// Para trabajar también con JSON (lo necesitaremos más adelante)
app.use(express.json());

app.get('/', (req, res) => {
    res.send('<h1>euVWA - versión segura</h1><p>Aplicación lista para pruebas</p>');
});
// Formulario de login - Simulado
app.get('/login', (req, res) => {
    res.send(`
        <h2>Login</h2>
        <form method="POST" action="/login">
            Usuario: <input type="text" name="username" /><br/>
            Password: <input type="password" name="password" /><br/>
            <button type="submit">Entrar</button>
        </form>
    `);
});

// --- 3. Vulnerabilidad: XSS Almacenado ---

// Simulamos una base de datos con un array (en memoria)
const comentarios = [];

// Ruta para mostrar la página de comentarios
app.get('/comentarios', (req, res) => {
//  Convertimos los comentarios en HTML para mostrarlos en pantalla
// Los comentarios ya se guardan limpiados para evitar XSS
// Los comentarios se guardan ya limpiados para evitar ejecución de scripts
const listaComentarios = comentarios
.map(c => `<li>${c}</li>`)
.join('');
    res.send(`
        <h2>Libro de visitas (Seguro)</h2>

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
        comentarios.push(escapeHTML(texto));
    }

    // Redirigimos para mostrar la lista actualizada
    res.redirect('/comentarios');
});

// --- 4. COMMAND INJECTION - Protegido ---
const { exec } = require('child_process');
app.get('/ping', (req, res) => {
    res.send(`
        <h2>Herramienta de red: Ping (Seguro)</h2>
        <form action="/ping" method="POST">
            <label>IP a comprobar:</label>
            <input type="text" name="ip" placeholder="127.0.0.1">
            <button type="submit">Hacer Ping</button>
        </form>
        <br><a href="/">Volver al inicio</a>
    `);
});

app.post('/ping', (req, res) => {
    let ip = req.body.ip || '';

    // Solo dejamos pasar números y puntos
    const formatoValido = /^[0-9.]+$/.test(ip);

    if (!formatoValido) {
        return res.send("IP no válida");
    }

    let comando = 'ping -n 1 ' + ip;

    exec(comando, (error, stdout, stderr) => {
        let resultado = stdout || stderr || "Error";

        res.send(`
            <h2>Resultado:</h2>
            <pre>${resultado}</pre>
            <a href="/ping">Volver</a>
        `);
    });
});
// --- 5. FILE UPLOAD - versión segura ---
const path = require('path');
// Aquí configuramos multer para que no acepte cualquier cosa
const uploadSeguro = multer({ 
    dest: 'uploads/',
    // Limitamos el tamaño para que no nos suban archivos gigantes
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: (req, file, cb) => {
        // Solo queremos imágenes
        const filetypes = /jpg|jpeg|png|gif/;
        // Miramos la extensión del archivo
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        // Y también el tipo MIME (por si intentan colar algo raro)
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            // Todo ok → dejamos subir el archivo
            return cb(null, true);
        } else {
            // Si no cumple, lo bloqueamos directamente
            cb(new Error("Solo se permiten imágenes"));
        }
    }
});
// Formulario
app.get('/subir', (req, res) => {
    res.send(`
        <h2>Sube tu imagen (Seguro)</h2>
        <form action="/subir" method="POST" enctype="multipart/form-data">
            <input type="file" name="archivo"><br><br>
            <button type="submit">Subir archivo</button>
        </form>
        <br><a href="/">Volver</a>
    `);
});
// Subida controlada
app.post('/subir', (req, res) => {
    const uploadSingle = uploadSeguro.single('archivo');
    uploadSingle(req, res, function (err) {

        // Si el filtro salta o el archivo pesa demasiado
        if (err) {
            console.log("Intento bloqueado:", err.message);

            return res.send(`
                <h2 style="color:red;">Subida bloqueada</h2>
                <p>${err.message}</p>
                <a href="/subir">Volver</a>
            `);
        }
        // Por si no han seleccionado nada
        if (!req.file) {
            return res.send("No has subido ningún archivo.");
        }

        // Todo correcto
        res.send(`
            <h2>Archivo subido correctamente</h2>
            <p>Archivo: <b>${req.file.originalname}</b></p>
            <a href="/subir">Subir otro</a>
        `);
    });
});
// LOGIN no VULNERABLE ya protegido: sin SQL Injection y con sesión segura
// LOGIN seguro usando JWT (sustituye el sistema antiguo de cookies)
app.post('/login', (req, res) => {

    // Cogemos lo que mete el usuario en el formulario
    const { username, password } = req.body;

    console.log("Intento de login:", username);

    // Comprobación básica (simulada)
    // En un sistema real esto vendría de base de datos + contraseña hasheada
    if (username === "admin" && password === "1234") {

        // Aquí generamos el token JWT
        // Básicamente es una "llave" que representa la sesión del usuario
        const token = jwt.sign(
            { user: username },   // lo que guardamos dentro del token
            SECRET_KEY,           // clave secreta para firmarlo
            { expiresIn: "1h" }   // caduca en 1 hora
        );

        // Mostramos el token en pantalla para poder verlo (para la práctica)
        res.send(`
            <h1>Login correcto</h1>
            <p>Token generado:</p>
            <textarea rows="5" cols="60">${token}</textarea>
            <br><br>
            <p>Este token representa una sesión segura</p>
        `);

    } else {
        // Mensaje genérico para no dar pistas
        res.status(401).send("<h1>Error: Credenciales incorrectas</h1>");
    }
});
//   7. SECURITY MISCONFIGURATION - Protegido O.K.

app.get('/config-rota', (req, res) => {
    try {
        // Simulamos un fallo interno del servidor
        throw new Error("Fallo interno de conexión");

    } catch (error) {

        // Guardamos el error solo para nosotros (no para el usuario)
        console.error("Error interno:", error.message);

        // Al usuario le damos un mensaje genérico
        res.status(500).send(`
            <h2>Error del servidor</h2>
            <p>Ha ocurrido un problema. Inténtalo más tarde.</p>
            <br><a href="/">Volver</a>
        `);
    }
});
// --- 8. Vulnerabilidad: Sensitive Data Exposure ---
// Simulación de base de datos
const usuariosBD = [
    { id: 1, username: "admin", password_en_claro: "SuperSecreta123", tarjeta: "4532-1111-2222-3333" },
    { id: 2, username: "alumno", password_en_claro: "aprobado5", tarjeta: "9999-8888-7777-6666" }
];
// API segura porque filtra datos sensibles
app.get('/api/usuarios', (req, res) => {
const usuariosSeguros = usuariosBD.map(usuario => {
    return {
        id: usuario.id,
        username: usuario.username
    };
});

res.json({
    estado: "OK",
    datos: usuariosSeguros
});
});

// La página para acceder fácilmente
app.get('/perfiles', (req, res) => {
    res.send(`
     <h2>Directorio de usuarios (Seguro)</h2>
     <p>La API solo devuelve información pública de los usuarios:</p>
     <a href="/api/usuarios" target="_blank">Consultar API</a>
     <br><br><a href="/">Volver</a>
    `);
});
app.listen(3001, () => {
    console.log("Servidor corriendo en http://localhost:3001");
});