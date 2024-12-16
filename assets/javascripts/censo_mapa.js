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
            console.warn('Coordenadas inválidas:', markerData);
            return;
          }
          
          validMarkersCount++;
          const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: "#3498db",
            color: "#2980b9",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          });
          
          const popupContent = `
            <div class="marker-info">
              <h3>${escapeHtml(markerData.title)}</h3>
              <div><strong>Localidad:</strong> ${escapeHtml(markerData.location || 'No especificada')}</div>
              <div><strong>Dirección:</strong> ${escapeHtml(markerData.address || 'No especificada')}</div>
              <div><strong>Tipo:</strong> ${escapeHtml(markerData.building_type || 'No especificado')}</div>
              <div class="marker-actions">
                <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank">
                  Ver en Google Maps
                </a>
                <a href="/issues/${markerData.id}">
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
        }
      } catch (error) {
        console.error('Error al mostrar marcadores:', error);
        showErrorMessage('Error al mostrar los marcadores en el mapa.');
      }
    }
    
    function updateCounter(count) {
      const counterElement = document.getElementById('censo-counter');
      if (counterElement) counterElement.textContent = count;
    }
    
    function showErrorMessage(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-error';
      errorDiv.style.cssText = 'margin:10px;padding:10px;background:#fee;border:1px solid #fcc;border-radius:4px;';
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
        
        const filteredMarkers = mapMarkers.filter(marker => {
          return (!locationFilter || marker.location === locationFilter) &&
                 (!buildingTypeFilter || marker.building_type === buildingTypeFilter) &&
                 (!addressFilter || (marker.address && marker.address.toLowerCase().includes(addressFilter)));
        });
        
        displayMarkers(filteredMarkers);
      } catch (error) {
        console.error('Error al aplicar filtros:', error);
        showErrorMessage('Error al aplicar los filtros.');
      }
    }
    
    window.resetFilters = function() {
      try {
        document.getElementById('location-filter').value = '';
        document.getElementById('building-type-filter').value = '';
        document.getElementById('address-filter').value = '';
        displayMarkers(mapMarkers);
      } catch (error) {
        console.error('Error al resetear filtros:', error);
        showErrorMessage('Error al resetear los filtros.');
      }
    }
  
    initMap();
  
    window.addEventListener('resize', function() {
      if (map) map.invalidateSize();
    });
  });