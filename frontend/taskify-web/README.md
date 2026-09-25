# Taskify Web

Frontend Angular 17 standalone, TypeScript estricto, RxJS y SCSS. Sin librería UI adicional.

## Ejecutar

Requiere Node/npm compatibles con el proyecto y la API Spring Boot en el puerto 8080 con MongoDB configurado.

```sh
npm install
npm start
```

Abrir http://localhost:4200 (el CORS del backend permite ese origen).
El registro devuelve ambos tokens e inicia sesión automáticamente; también existe login independiente.

```sh
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

El build de producción se guarda en `dist/taskify-web/browser`.
Producción usa `/api`: configurar el servidor para dirigir ese prefijo al backend y servir `index.html` para las rutas Angular. Desarrollo usa la URL de `src/environments/environment.ts`.

## Despliegue en Vercel

Importar `robermurcia/taskify` y usar la rama de producción `main`:

| Campo | Valor |
| --- | --- |
| Root Directory | `frontend/taskify-web` |
| Framework Preset | `Angular` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist/taskify-web/browser` |
| Variables de entorno del frontend | Ninguna |

`vercel.json` fija estos comandos y el directorio real del builder Angular `application`. Primero reenvía `/api/:path*` a `https://taskify-api-k6vs.onrender.com/api/:path*`; después sirve `index.html` para las rutas Angular, permitiendo recargar `/login` o `/register`. Los archivos estáticos existentes se sirven normalmente.

En Render, configurar `CORS_ALLOWED_ORIGINS` con el origen HTTPS exacto asignado por Vercel, sin barra final. Configurar también una `SECRET_KEY` Base64 de al menos 32 bytes aleatorios según el README del backend. Nunca poner `SECRET_KEY` ni `MONGO_URI` en Vercel o en el código frontend. Los dominios de preview necesitan autorización explícita en CORS si se van a usar.

## Responsabilidades

- `core/auth`: contrato de autenticación, guard y JWT interceptor.
- `core/services/token.service.ts`: almacenamiento de access/refresh token; lectura del subject para mostrar el correo (sin usarlo para autorizar).
- `core/tasks/task.service.ts`: endpoints reales y recorrido paginado.
- `core/tasks/task-date.ts`: fechas locales YYYY-MM-DD y regla única de ocurrencias.
- `pages`: login, registro y shell autenticado.
- `components/task-list`: coordinación de estado, filtros, paginación visual y mutaciones.
- `components/day-selector`: ventana de 14 días, desplazamiento y navegación.
- `components/task-form`: formulario reactivo tipado; copia del estado al editar.
- `components/task-item`: presentación y acciones de una tarea.
- `components/modal`: dialog nativo, foco, Escape, bloqueo durante peticiones.
- `styles.scss` y `pages/auth.scss`: tokens, controles y estilos compartidos.

Las suscripciones de componentes usan `takeUntilDestroyed`. Las mutaciones actualizan el estado con la respuesta del servidor, sin reload ni recargar el listado completo. Botones y métodos bloquean operaciones duplicadas.

## Contrato real de API

| Operación | Endpoint |
| --- | --- |
| Registro / login | POST /api/auth/register, POST /api/auth/login |
| Renovar / revocar | POST /api/auth/refresh, POST /api/auth/logout; body: refreshToken |
| Listar | GET /api/tasks?page=0&size=50&sort=id,asc |
| Crear / editar | POST /api/tasks, PUT /api/tasks/{id} |
| Eliminar serie | DELETE /api/tasks/{id} |
| Completar | PUT /api/tasks/{id}/complete?completed=true |
| Omitir ocurrencia | PUT /api/tasks/{id}/exclude?date=YYYY-MM-DD |

TaskRequest: title (1–60), description (máximo 500), taskDate, priority, repeatDays.
TaskResponse: id, esos campos, completed, excludedDates, createdAt, updatedAt.
`excludedDates` se conserva en servidor al editar; no pertenece al DTO de entrada.
El formulario exige fecha para evitar crear tareas invisibles en el calendario.

La ruta principal aplica el guard. El interceptor adjunta JWT solo a la API configurada, excluye las rutas de autenticación y comparte una única renovación concurrente. Reintenta una sola vez. Un 500 en la operación reintentada no borra una sesión válida. Logout revoca en servidor y limpia localmente incluso si falla; en ese caso el login muestra que no se pudo confirmar la revocación.

## Fechas y limitaciones de la API

Una tarea aparece si coincide taskDate **o** el día semanal está en repeatDays, salvo que la fecha esté en excludedDates. Se filtra cada tarea una sola vez. No se convierten fechas de calendario a UTC. La fecha inicial no limita el inicio de la repetición: se respeta la regla OR solicitada.

La API no tiene consulta por rango que combine fecha y recurrencias. `/today` solo busca fecha exacta y usa el día del servidor. Por eso se recorren todas las páginas de 50 con orden estable, se deduplican IDs y solo se publica un calendario cuando la carga termina. Si falla una página se ofrece reintento, sin presentar resultados parciales como completos.

Para historiales grandes conviene añadir una consulta de rango con recurrencias/exclusiones y paginación estable. La paginación por offset no ofrece una instantánea ante escrituras concurrentes desde otros dispositivos: el frontend no puede garantizarla.

`completed` pertenece a la tarea completa. Completar una recurrente afecta a toda la serie, y editar modifica toda la tarea; se avisa en el formulario y en su control de completado. Completar por ocurrencia requeriría otro modelo/contrato de backend y no se ha simulado en el frontend.

## Cambios mínimos en backend

- TaskController: incluir excludedDates en las respuestas de create y update.
- SecurityConfig: devolver 401 ante autenticación ausente/inválida para permitir el refresh del cliente.
- Tests: regresión del DTO y prueba de la cadena real de filtros JWT.

No se cambiaron endpoints, persistencia ni modelos de negocio.

## Verificación y alcance

- Instalación npm y build de producción, sin errores ni avisos Angular.
- 27 pruebas de servicios, guard, interceptor, fechas, paginación, formulario y mutaciones, incluida confirmación única de borrado y checkbox con petición fallida.
- 33 pruebas del backend (servicios, controllers y filtros de seguridad).
- Recorrido visual en navegador a 390, 820 y 1440 px con API temporal en memoria: login, calendario, crear/editar, completar, modal de borrado, Escape y logout. Sin errores de consola en ese recorrido. El servidor de prueba no forma parte de la app.
- Pendiente de validación de despliegue: recorrido completo contra una instancia real de MongoDB y la configuración final de proxy/orígenes. Las pruebas de backend utilizan mocks de persistencia.
- Avisos previos del backend: MockBean obsoleto, serialización directa de PageImpl y configuración explícita de AuthenticationProvider. No impiden las pruebas; se dejan fuera del cambio mínimo solicitado.

En esta máquina el wrapper Maven de Windows falla al inspeccionar su caché (matriz nula). Se ejecutaron los tests con la distribución Maven 3.9.11 ya instalada y el repositorio local explícito. No se modificó el wrapper.
