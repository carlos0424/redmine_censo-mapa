// assets/javascripts/censo_mapa.js
document.addEventListener('DOMContentLoaded', function() {
    let map;
    let markersLayer;
    let activeInfoWindow = null;
    
    function initMap() {
      console.log('Iniciando mapa...');
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
  
        if (mapMarkers && mapMarkers.length > 0) {
          displayMarkers(mapMarkers);
        } else {
          console.log('No hay marcadores para mostrar');
          document.getElementById('censo-counter').textContent = '0';
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
      if (!markersLayer) {
        console.error('Layer de marcadores no inicializada');
        return;
      }
      
      try {
        markersLayer.clearLayers();
        updateCounter(markersToShow.length);
        
        const bounds = L.latLngBounds();
        let validMarkersCount = 0;
        
        markersToShow.forEach(markerData => {
          const lat = parseFloat(markerData.lat);
          const lng = parseFloat(markerData.lng);
          
          if (isNaN(lat) || isNaN(lng)) {
            console.warn('Coordenadas inválidas para el marcador:', markerData);
            return;
          }
          
          validMarkersCount++;
  
          // Determinar color basado en el estado
          const markerColor = markerData.status_id === 12 ? {
            fillColor: "#e74c3c",  // Rojo para Rechazo interventoría
            color: "#c0392b",
            fillOpacity: 0.8
          } : {
            fillColor: "#3498db",  // Azul para otros estados
            color: "#2980b9",
            fillOpacity: 0.8
          };
          
          const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: markerColor.fillColor,
            color: markerColor.color,
            weight: 2,
            opacity: 1,
            fillOpacity: markerColor.fillOpacity
          });
          
          const popupContent = `
            <div class="marker-info">
              <h3>${escapeHtml(markerData.title || 'Sin título')}</h3>
              <div class="marker-info-content">
                <div><strong class="marker-label">Localidad:</strong> ${escapeHtml(markerData.location || 'No especificada')}</div>
                <div><strong class="marker-label">Dirección:</strong> ${escapeHtml(markerData.address || 'No especificada')}</div>
                <div><strong class="marker-label">Tipo:</strong> ${escapeHtml(markerData.building_type || 'No especificado')}</div>
                <div><strong class="marker-label">Estado:</strong> ${escapeHtml(markerData.status || 'No especificado')}</div>
                <div><strong class="marker-label">Actualizado:</strong> ${escapeHtml(markerData.updated_on || 'No especificado')}</div>
              </div>
              <div class="marker-actions">
                <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" class="marker-button">
                  Ver en Google Maps
                </a>
                <a href="/issues/${markerData.id}" class="marker-button">
                  Ver Censo
                </a>
              </div>
            </div>
          `;
          
          marker.bindPopup(popupContent);
          marker.addTo(markersLayer);
          bounds.extend([lat, lng]);
        });
        
        if (validMarkersCount > 0 && bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 16
          });
        } else {
          console.warn('No se encontraron marcadores válidos para mostrar');
          map.setView([4.5709, -74.2973], 13);
        }
      } catch (error) {
        console.error('Error al mostrar marcadores:', error);
        showErrorMessage('Error al mostrar los marcadores en el mapa.');
      }
    }
    
    function updateCounter(count) {
      const counterElement = document.getElementById('censo-counter');
      if (counterElement) {
        counterElement.textContent = count;
      }
    }
    
    function showErrorMessage(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-error';
      errorDiv.style.cssText = 'margin:10px;padding:10px;background:#fee;border:1px solid #fcc;border-radius:4px;color:#333;';
      errorDiv.textContent = message;
      
      const mapElement = document.getElementById('censo-map');
      if (mapElement) {
        mapElement.parentNode.insertBefore(errorDiv, mapElement);
      }
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
        const locationFilter = document.getElementById('location-filter').value;
        const buildingTypeFilter = document.getElementById('building-type-filter').value;
        const addressFilter = document.getElementById('address-filter').value.toLowerCase();
        const titleFilter = document.getElementById('title-filter').value.toLowerCase();
        
        const filteredMarkers = mapMarkers.filter(marker => {
          const locationMatch = !locationFilter || marker.location === locationFilter;
          const buildingTypeMatch = !buildingTypeFilter || marker.building_type === buildingTypeFilter;
          const addressMatch = !addressFilter || (marker.address && marker.address.toLowerCase().includes(addressFilter));
          const titleMatch = !titleFilter || (marker.title && marker.title.toLowerCase().includes(titleFilter));
          
          return locationMatch && buildingTypeMatch && addressMatch && titleMatch;
        });
        
        if (filteredMarkers.length === 0) {
          showErrorMessage('No se encontraron resultados para los filtros aplicados.');
        }
        
        displayMarkers(filteredMarkers);
      } catch (error) {
        console.error('Error al aplicar filtros:', error);
        showErrorMessage('Error al aplicar los filtros. Por favor, inténtalo de nuevo.');
      }
    }
    
    window.resetFilters = function() {
      try {
        // Limpiar todos los filtros
        const filters = ['location-filter', 'building-type-filter', 'address-filter', 'title-filter'];
        filters.forEach(filterId => {
          const element = document.getElementById(filterId);
          if (element) element.value = '';
        });
        
        // Mostrar todos los marcadores
        displayMarkers(mapMarkers);
        
        // Remover mensajes de error si existen
        const errorMessages = document.querySelectorAll('.alert.alert-error');
        errorMessages.forEach(msg => msg.remove());
      } catch (error) {
        console.error('Error al resetear filtros:', error);
        showErrorMessage('Error al resetear los filtros. Por favor, recarga la página.');
      }
    }
  
    // Función para manejar el cambio de tamaño de la ventana
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (map) {
          map.invalidateSize();
        }
      }, 250);
    });
  
    // Inicializar el mapa
    initMap();
  });