const express = require('express');
const axios = require('axios');
const translate = require('node-google-translate-skidz');
const app = express();

const baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1';

app.use(express.static('public'));
app.use(express.json());

app.post('/api/artworks', async (req, res) => {
    try {
        const { departmentId, keyword, location, page = 1 } = req.body;
        let queryUrl = `${baseUrl}/search?hasImages=true&q=${keyword || ''}`;

        if (departmentId) queryUrl += `&departmentId=${departmentId}`;
        if (location) queryUrl += `&geoLocation=${location}`;

        const result = await axios.get(queryUrl);
        let objectIDs = result.data.objectIDs;

        if (!objectIDs || objectIDs.length === 0) {
            return res.status(200).json({ message: 'No se encontraron resultados.', objects: [], totalObjects: 0 });
        }

        // Limitar los IDs 
        if (objectIDs.length > 80) {
            objectIDs = objectIDs.slice(0, 80);
        }

        // Fetch concurrente de todos los objetos
        const objectPromises = objectIDs.map(async (id) => {
            try {
                const objectData = await axios.get(`${baseUrl}/objects/${id}`);
                const objectInfo = objectData.data;

                // Filtrar por las propiedades necesarias
                if (objectInfo.primaryImageSmall) {
                    const title = await translateText(objectInfo.title, 'es');
                    const culture = await translateText(objectInfo.culture, 'es');
                    const dynasty = await translateText(objectInfo.dynasty, 'es');

                    return {
                        id: objectInfo.objectID,
                        image: objectInfo.primaryImageSmall,
                        title,
                        culture,
                        dynasty,
                        date: objectInfo.objectDate || 'Desconocido',
                        additionalImages: objectInfo.additionalImages
                    };
                }
                return null; 
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.warn(`Objeto con ID ${id} no encontrado.`);
                } else {
                    console.error(`Error al obtener el objeto ${id}:`, error);
                }
                return null;
            }
        });

        // Esperar a que todas las promesas se resuelvan
        const objects = await Promise.all(objectPromises);

        
        const objetosFiltrados = objects.filter(obj => obj !== null);

        const totalObjetosValidos = objetosFiltrados.length;
        const totalPaginas = Math.ceil(totalObjetosValidos / 20);

        if (page > totalPaginas) {
            return res.status(200).json({ message: 'Página fuera de rango.', objects: [], totalObjects: totalObjetosValidos });
        }

        // Realizar la paginación solo sobre los objetos válidos
        const paginatedObjects = objetosFiltrados.slice((page - 1) * 20, page * 20);

        res.json({ objects: paginatedObjects, totalObjects: totalObjetosValidos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al hacer fetch de los datos de la API.' });
    }
});

// Endpoint para recuperar los departamentos en la API
app.get('/api/departments', async (req, res) => {
    try {
        const response = await axios.get(`${baseUrl}/departments`);
        const departments = response.data.departments;
        res.json(departments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al hacer fetch de los departamentos' });
    }
});