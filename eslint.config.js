// Plugin de seguridad para ESLint para detectar patrones inseguros en JavaScript,
// especialmente vulnerabilidades típicas en aplicaciones Node.js.
const security = require("eslint-plugin-security");

module.exports = [

  // Configuración principal para todos los ficheros .js del proyecto.
  {
    files: ["**/*.js"],

    // Cargamos el plugin de seguridad.
    plugins: {
      security
    },

    // Reglas básicas orientadas a detectar código potencialmente peligroso.
    rules: {

      // Detecta posibles accesos inseguros a objetos dinámicos.
      // Muy útil para prevenir ciertas vulnerabilidades de manipulación.
      "security/detect-object-injection": "warn",

      // Detecta el uso de child_process y exec().
      // En esta práctica es interesante porque la versión vulnerable
      // utiliza exec() y ESLint debe marcarlo como comportamiento inseguro.
      "security/detect-child-process": "warn"
    }
  }
];