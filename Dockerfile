# Desarrollo Seguro de Aplicaciones
#Actividad 2 – Pipeline DevSecOps sobre euVWA
#Alumno: Raúl Miguel FernandesPipeline DevSecOps para euVWA
# Imagen ligera basada en Alpine para reducir tamaño
# y minimizar superficie de ataque.
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor.
WORKDIR /app

# Primero copio package.json para aprovechar cache
# de Docker en futuras builds.
COPY package*.json ./

# Instalación de dependencias del proyecto.
RUN npm install

# Copia del resto de archivos de la aplicación.
COPY . .

# Creo un usuario no-root para evitar ejecutar
# la aplicación como administrador dentro del contenedor.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Cambio al usuario seguro.
USER appuser

# Puerto utilizado por la aplicación.
EXPOSE 3000

# Arranque de la aplicación vulnerable.
CMD ["node", "vulnerable/app.js"]