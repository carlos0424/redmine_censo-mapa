document.addEventListener('DOMContentLoaded', function() {
    let map;
    let markersLayer;
    let currentAlertMessage = null;
    
    function initMap() {
        const mapElement = document.getElementById('censo-map');
        if (!mapElement) {
            console.error('Elemento del mapa no encontrado');
            return;
        }

        try {
            map = L.map('censo-map', {
                zoomControl: true,
                scrollWheelZoom: true,
                minZoom: 5,
                maxZoom: 19
            }).setView([4.5709, -74.2973], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            map.zoomControl.setPosition('topright');
            markersLayer = L.layerGroup().addTo(map);

            // Verificar y mostrar marcadores iniciales
            if (typeof mapMarkers !== 'undefined' && mapMarkers && mapMarkers.length > 0) {
                displayMarkers(mapMarkers);
            } else {
                console.log('No hay marcadores para mostrar');
                updateCounter(0);
            }

            setTimeout(() => {
                map.invalidateSize();
            }, 100);

        } catch (error) {
            console.error('Error al inicializar el mapa:', error);
            showErrorMessage('Error al cargar el mapa. Por favor, recarga la página.');
        }
    }
    
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
                const isRejected = String(markerData.status_id) === "12";
                
                const markerOptions = {
                    radius: 8,
                    fillColor: isRejected ? "#ff0000" : "#3498db",
                    color: isRejected ? "#cc0000" : "#2980b9",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                };

                const marker = L.circleMarker([lat, lng], markerOptions);
                
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
                            <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" class="marker-button">
                                Obtener ubicación
                            </a>
                            <a href="/issues/${markerData.id}" class="marker-button">
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
    
    function updateCounter(count) {
        const counterElement = document.getElementById('censo-counter');
        if (counterElement) {
            counterElement.textContent = count;
        }
    }
    
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
    
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    window.applyFilters = function() {
        try {
            const locationFilter = document.getElementById('location-filter').value.trim();
            const buildingTypeFilter = document.getElementById('building-type-filter').value.trim();
            const addressFilter = document.getElementById('address-filter').value.trim().toLowerCase();
            const censusNumberFilter = document.getElementById('title-filter').value.trim();
            
            console.log('Aplicando filtros:', {
                location: locationFilter,
                buildingType: buildingTypeFilter,
                address: addressFilter,
                censusNumber: censusNumberFilter
            });

            const filteredMarkers = mapMarkers.filter(marker => {
                const locationMatch = !locationFilter || (marker.location && marker.location === locationFilter);
                const buildingTypeMatch = !buildingTypeFilter || (marker.building_type && marker.building_type === buildingTypeFilter);
                const addressMatch = !addressFilter || (marker.address && marker.address.toLowerCase().includes(addressFilter));
                const censusMatch = !censusNumberFilter || (marker.id && marker.id.toString() === censusNumberFilter);
                
                return locationMatch && buildingTypeMatch && addressMatch && censusMatch;
            });
            
            console.log('Marcadores filtrados:', filteredMarkers.length);
            
            if (filteredMarkers.length === 0) {
                showErrorMessage('No se encontraron resultados para los filtros aplicados.');
            }
            
            displayMarkers(filteredMarkers);
            
        } catch (error) {
            console.error('Error al aplicar filtros:', error);
            showErrorMessage('Error al aplicar los filtros. Por favor, inténtalo de nuevo.');
        }
    };
    
    window.resetFilters = function() {
        try {
            const filtersToReset = ['location-filter', 'building-type-filter', 'address-filter', 'title-filter'];
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

    // Manejador de redimensionamiento
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