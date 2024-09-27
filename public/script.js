let paginaActual = 1;
let totalObjects = 0;

const mensajeCargando = document.getElementById('mensaje-Cargando');
const artworkGrid = document.getElementById('artworkGrid');

// Función para mostrar el mensaje de carga
function mostrarCargando() {
    mensajeCargando.style.display = 'block'; 
    artworkGrid.innerHTML = ''; 
}

// Función para ocultar el mensaje de carga
function ocultarCargando() {
    mensajeCargando.style.display = 'none'; 
}

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

async function cargarDepartments() {
    try {
        const response = await fetch('/api/departments');
        const departments = await response.json();

        const departmentSelect = document.getElementById('department');
        departmentSelect.innerHTML = `<option value="">Selecciona un departamento</option>`; 

        // Rellenar el select con los departamentos disponibles
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.departmentId;
            option.textContent = dept.displayName;
            departmentSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar los departamentos:', error);
    }
}

function mostrarArtworks(objects) {
    const grid = document.getElementById('artworkGrid');
    grid.innerHTML = ''; // Limpiar la grilla

    if (!objects || objects.length === 0) {
        grid.innerHTML = '<h2>No se encontraron resultados.</h2>';
        return;
    }

    objects.forEach(obj => {
        const card = document.createElement('div');
        const culture = obj.culture || 'Ninguna';
        const dynasty = obj.dynasty || 'Ninguna';

        card.className = 'art-card';
        card.innerHTML = `
            <img src="${obj.image}" alt="${obj.title}" title="Fecha: ${obj.date}">
            <h3>${obj.title}</h3>
            <p>Cultura: ${culture}</p>
            <p>Dinastía: ${dynasty}</p>
        `;
        
         // Agregar botón para ver imágenes adicionales
         if (obj.additionalImages && obj.additionalImages.length > 0) {
            const additionalImagesButton = document.createElement('button');
            additionalImagesButton.textContent = 'Ver imágenes adicionales';
            additionalImagesButton.onclick = () => mostrarImagenesAdicionales(obj.additionalImages);
            card.appendChild(additionalImagesButton);
        }

        grid.appendChild(card);
    });
}

// Función para mostrar imágenes adicionales en una nueva ventana
function mostrarImagenesAdicionales(images) {
    const nuevaVentana = window.open('', '_blank');
    nuevaVentana.document.write('<h1>Imágenes Adicionales</h1>');

    nuevaVentana.document.write(`
        <style>
            body { display: flex; flex-direction: column; align-items: center; }
            img { max-width: 50%; margin-bottom: 10px; }
        </style>
    `);

    images.forEach((imgUrl) => {
         // Cambiar a primaryImageSmall
         const smallImageUrl = imgUrl.replace(/\/\d+$/, "/primaryImageSmall"); // Reemplaza el último segmento de la URL
         nuevaVentana.document.write(`<img src="${smallImageUrl}" alt="Imagen Adicional">`);
    });
}

function actualizarPaginacion() {
    const paginacion = document.getElementById('paginacion');
    paginacion.innerHTML = ''; // Limpiar la paginación
    const totalPaginas = Math.ceil(totalObjects / 20); // Calcular el total de páginas

    for (let i = 1; i <= totalPaginas; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.onclick = () => fetchObjetos(i); // Llamar a fetchObjetos con la nueva página
        if (i === paginaActual) {
            pageButton.disabled = true; // Desactivar el botón de la página actual
        }
        paginacion.appendChild(pageButton);
    }
}

document.addEventListener('DOMContentLoaded', cargarDepartments);