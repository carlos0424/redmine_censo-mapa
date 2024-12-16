/**
 * censo_mapa.js
 * Versión: 1.1.0
 * Autor: Carlos Arbelaez
 * 
 * Este script maneja la funcionalidad del mapa de censos, incluyendo:
 * - Inicialización del mapa usando OpenStreetMap
 * - Gestión de marcadores y popups
 * - Sistema de filtrado por múltiples criterios
 * - Manejo de estados y colores de marcadores
 * - Gestión de mensajes de error
 * - Adaptación responsive
 */

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let map;
    let markersLayer;
    let currentAlertMessage = null;
    
    /**
     * Inicializa el mapa y sus configuraciones básicas
     */
    function initMap() {
        const mapElement = document.getElementById('censo-map');
        if (!mapElement) {
            console.error('Elemento del mapa no encontrado');
            return;
        }

        try {
            // Configuración inicial del mapa
            map = L.map('censo-map', {
                zoomControl: true,
                scrollWheelZoom: true,
                minZoom: 5,
                maxZoom: 19
            }).setView([4.5709, -74.2973], 13);
            
            // Agregar capa de OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Configurar controles
            map.zoomControl.setPosition('topright');
            markersLayer = L.layerGroup().addTo(map);

            // Cargar marcadores iniciales
            if (typeof mapMarkers !== 'undefined' && mapMarkers && mapMarkers.length > 0) {
                console.log('Cargando marcadores iniciales:', mapMarkers.length);
                displayMarkers(mapMarkers);
            } else {
                console.log('No hay marcadores para mostrar');
                updateCounter(0);
            }

            // Ajustar tamaño después de la carga
            setTimeout(() => {
                map.invalidateSize();
            }, 100);

        } catch (error) {
            console.error('Error al inicializar el mapa:', error);
            showErrorMessage('Error al cargar el mapa. Por favor, recarga la página.');
        }
    }
    
    /**
     * Muestra los marcadores en el mapa
     * @param {Array} markersToShow - Array de marcadores a mostrar
     */
    function displayMarkers(markersToShow) {
        if (!markersLayer) return;
        
        try {
            markersLayer.clearLayers();
            updateCounter(markersToShow.length);
            
            const bounds = L.latLngBounds();
            let validMarkersCount = 0;
            
            markersToShow.forEach(markerData => {
                const lat = parseFloat(markerData.lat);
                const lng = parseFloat(markerData.lng);
                
                if (isNaN(lat) || isNaN(lng)) {
                    console.warn('Marcador sin coordenadas válidas:', markerData);
                    return;
                }
                
                validMarkersCount++;

                // Determinar color basado en el estado (ID 12 = Rechazado)
                const isRejected = String(markerData.status_id) === "12";
                
                const markerOptions = {
                    radius: 8,
                    fillColor: isRejected ? "#e74c3c" : "#3498db", // Rojo para rechazados, azul para otros
                    color: isRejected ? "#c0392b" : "#2980b9",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                };

                const marker = L.circleMarker([lat, lng], markerOptions);
                
                // Contenido del popup
                const popupContent = `
                    <div class="marker-info">
                        <h3>Censo #${markerData.id}</h3>
                        <div class="marker-info-content">
                            <div class="info-row"><span class="label">Localidad:</span> ${escapeHtml(markerData.location || 'No especificada')}</div>
                            <div class="info-row"><span class="label">Dirección:</span> ${escapeHtml(markerData.address || 'No especificada')}</div>
                            <div class="info-row"><span class="label">Tipo:</span> ${escapeHtml(markerData.building_type || 'No especificado')}</div>
                            <div class="info-row"><span class="label">Estado:</span> ${escapeHtml(markerData.status || 'No especificado')}</div>
                        </div>
                        <div class="marker-actions">
                            <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" class="marker-button location-button">
                                <i class="icon-location"></i>
                                Obtener ubicación
                            </a>
                            <a href="/issues/${markerData.id}" class="marker-button view-button">
                                <i class="icon-doc"></i>
                                Ver Censo
                            </a>
                        </div>
                    </div>
                `;
                
                marker.bindPopup(popupContent, {
                    maxWidth: 300,
                    minWidth: 200
                });
                
                marker.addTo(markersLayer);
                bounds.extend([lat, lng]);
            });
            
            if (validMarkersCount > 0 && bounds.isValid()) {
                map.fitBounds(bounds, {
                    padding: [50, 50],
                    maxZoom: 16
                });
            }
        } catch (error) {
            console.error('Error al mostrar marcadores:', error);
            showErrorMessage('Error al mostrar los marcadores.');
        }
    }
    
    /**
     * Actualiza el contador de censos
     * @param {number} count - Número de censos a mostrar
     */
    function updateCounter(count) {
        const counterElement = document.getElementById('censo-counter');
        if (counterElement) {
            counterElement.textContent = count;
        }
    }
    
    /**
     * Muestra mensajes de error
     * @param {string} message - Mensaje de error a mostrar
     */
    function showErrorMessage(message) {
        if (currentAlertMessage) {
            currentAlertMessage.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.style.cssText = 'margin:10px;padding:10px;background:#fee;border:1px solid #fcc;border-radius:4px;color:#333;';
        errorDiv.textContent = message;
        
        const mapElement = document.getElementById('censo-map');
        if (mapElement) {
            mapElement.parentNode.insertBefore(errorDiv, mapElement);
            currentAlertMessage = errorDiv;
        }

        setTimeout(() => {
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.remove();
                currentAlertMessage = null;
            }
        }, 5000);
    }
    
    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} unsafe - Texto a escapar
     * @returns {string} Texto escapado
     */
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    /**
     * Aplica los filtros seleccionados
     */
    window.applyFilters = function() {
        try {
            const locationFilter = document.getElementById('location-filter').value.trim();
            const buildingTypeFilter = document.getElementById('building-type-filter').value.trim();
            const addressFilter = document.getElementById('address-filter').value.trim().toLowerCase();
            const censusNumberFilter = document.getElementById('title-filter').value.trim();
            const statusFilter = document.getElementById('status-filter')?.value.trim();
            
            console.log('Aplicando filtros:', {
                location: locationFilter,
                buildingType: buildingTypeFilter,
                address: addressFilter,
                censusNumber: censusNumberFilter,
                status: statusFilter
            });

            const filteredMarkers = mapMarkers.filter(marker => {
                const locationMatch = !locationFilter || (marker.location && marker.location === locationFilter);
                const buildingTypeMatch = !buildingTypeFilter || (marker.building_type && marker.building_type === buildingTypeFilter);
                const addressMatch = !addressFilter || (marker.address && marker.address.toLowerCase().includes(addressFilter));
                const censusMatch = !censusNumberFilter || (marker.id && marker.id.toString() === censusNumberFilter);
                const statusMatch = !statusFilter || (marker.status_id && marker.status_id.toString() === statusFilter);
                
                return locationMatch && buildingTypeMatch && addressMatch && censusMatch && statusMatch;
            });
            
            if (filteredMarkers.length === 0) {
                showErrorMessage('No se encontraron resultados para los filtros aplicados.');
            }
            
            displayMarkers(filteredMarkers);
            
        } catch (error) {
            console.error('Error al aplicar filtros:', error);
            showErrorMessage('Error al aplicar los filtros. Por favor, inténtalo de nuevo.');
        }
    };
    
    /**
     * Resetea todos los filtros
     */
    window.resetFilters = function() {
        try {
            const filtersToReset = ['location-filter', 'building-type-filter', 'address-filter', 'title-filter', 'status-filter'];
            filtersToReset.forEach(filterId => {
                const element = document.getElementById(filterId);
                if (element) {
                    element.value = '';
                }
            });
            
            if (currentAlertMessage) {
                currentAlertMessage.remove();
                currentAlertMessage = null;
            }
            
            if (mapMarkers && mapMarkers.length > 0) {
                displayMarkers(mapMarkers);
            }
            
        } catch (error) {
            console.error('Error al resetear filtros:', error);
            showErrorMessage('Error al resetear los filtros.');
        }
    };

    // Manejador de redimensionamiento con debounce
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 250);
    });

    // Inicializar mapa
    initMap();
});