let paginaActual = 1;
let totalObjects = 0;

async function fetchObjetos(page = 1) {
    const department = document.getElementById('department').value;
    const keyword = document.getElementById('keyword').value;
    const location = document.getElementById('location').value;

    mostrarCargando(); // Mostrar el mensaje de carga antes de iniciar la búsqueda

    try{
        const response = await fetch('/api/artworks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ departmentId: department, keyword, location, page })
        });
        const data = await response.json();
        totalObjects = data.totalObjects; // Guardar el total de objetos
        paginaActual = page; // Actualizar la página actual
        mostrarArtworks(data.objects);
        actualizarPaginacion(); // Actualizar la paginación
    }catch(error){
        console.error('Error al hacer fetch de artworks:', error);
        mostrarError('Hubo un error al cargar los resultados.');
    } finally {
        ocultarCargando(); // Ocultar el mensaje de carga al terminar la carga
    }
    
}