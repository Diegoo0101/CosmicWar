# 🚀 SpaceWar

**SpaceWar** es un videojuego tipo *shoot 'em up* desarrollado como Proyecto de Fin de Ciclo del Grado Superior en Desarrollo de Aplicaciones Web. Está diseñado para jugarse directamente desde el navegador, sin instalaciones, y combina tecnologías modernas como React, Phaser.js y Firebase.

## 🎮 Descripción

El jugador controla una nave espacial y debe enfrentarse a oleadas infinitas de enemigos que se vuelven progresivamente más difíciles. Al final de cada oleada aparece un jefe. Los enemigos pueden soltar monedas y potenciadores que mejoran temporalmente las capacidades del jugador.

El juego incluye:
- Clasificación en línea de los 10 mejores jugadores.
- Ingreso con cuenta de Google.
- Tienda de cosméticos con monedas ganadas en el juego.
- Personalización visual del jugador, enemigos y fondo.
- Interfaz reactiva y moderna.
- Efectos visuales, música y sonido envolvente.

## 🌐 Demo

Juega en línea:  
🔗 [https://cosmic-war-7b420.web.app](https://cosmic-war-7b420.web.app)

## 🛠️ Tecnologías

- **Frontend**: React, CSS3, Vite
- **Juego**: Phaser.js
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **Email**: Formspree
- **Editor**: Visual Studio Code

## 🚀 Instalación y ejecución local

### Requisitos
- Node.js
- Navegador moderno
- IDE recomendado: VS Code

### Pasos

1. Clona el repositorio o descarga el ZIP desde GitHub.
2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Ejecuta el proyecto en modo desarrollo:

   ```bash
   npm run dev
   ```

4. Abre tu navegador en [http://localhost:5173](http://localhost:5173)

## 🔐 Funcionalidades

### Funcionales

- Iniciar sesión con Google
- Guardar puntuación y monedas en tiempo real
- Comprar cosméticos con monedas ganadas
- Personalización de elementos del juego
- Tabla de clasificación en línea
- Envío de formularios de contacto vía email

### No funcionales

- Tiempo de carga menor a 3 segundos
- Fluidez sin retardos perceptibles
- Compatible con navegadores modernos
- Seguridad en manejo de datos

## 👤 Usuario

Algunas acciones disponibles para los usuarios autenticados:

- Ver y superar su puntuación máxima
- Acceder a tienda y personalizar nave/enemigos/fondo
- Ver su posición en el ranking global
- Contactar con el equipo de desarrollo
- Leer los términos y la política de privacidad

## 📄 Estructura del proyecto

```
/public/assets        # Recursos gráficos del juego
/src/game             # Lógica Phaser (escenas, shaders, configuraciones)
/src/components       # Componentes React (UI, tienda, contacto, etc.)
/src/firebase         # Configuración Firebase
App.jsx               # Componente principal
main.jsx              # Entrada del proyecto
```

## 🧪 Pruebas

El juego ha sido probado exhaustivamente, cubriendo más de 50 casos de uso:
- Mecánicas básicas y avanzadas (jefes, potenciadores, oleadas)
- Autenticación y gestión de sesión
- Compra y selección de cosméticos
- Formularios de contacto y validación
- Visualización de la tabla de clasificación

## 💡 Futuras mejoras

- Compatibilidad con dispositivos móviles
- Chat global entre jugadores
- Nuevos tipos de enemigos y jefes
- Contenidos exclusivos con microtransacciones

## 🧑‍💻 Autor

Desarrollado por **CosmicWar Team**  
📧 [cosmicwar.team@gmail.com](mailto:cosmicwar.team@gmail.com)

---

¡Gracias por jugar a SpaceWar! ⭐️
