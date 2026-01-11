# Taskify
Gestor de tareas diario desarrollado con **Angular** y **Spring Boot** para la gestión segura de tareas personales.

---

## Backend – Taskify API
Backend de la aplicación Taskify, encargado de la lógica de negocio, la seguridad y la gestión de datos.

### Tecnologías utilizadas
- Java 17  
- Spring Boot  
- Spring Security  
- JWT (Access Token + Refresh Token)  
- MongoDB Atlas  
- Swagger / OpenAPI  
- JUnit 5 + Mockito  

### Autenticación y seguridad
- Registro y login de usuarios
- Autenticación basada en JWT
- Access token de corta duración
- Refresh token persistido en base de datos
- Logout real mediante revocación del refresh token
- Endpoints protegidos y asociados al usuario autenticado (ownership)

### Funcionalidad principal
- CRUD completo de tareas
- Paginación, ordenación y filtros
- Cada usuario solo puede acceder a sus propias tareas

### Manejo de errores
- Excepciones personalizadas
- Respuestas de error unificadas
- Validaciones con Bean Validation

### Testing
- Tests unitarios de servicios
- Tests de controllers con MockMvc
