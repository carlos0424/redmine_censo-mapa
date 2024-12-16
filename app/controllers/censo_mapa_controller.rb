class CensoMapaController < ApplicationController
    before_action :find_project
    before_action :authorize
    
    def index
      @issues = Issue.open
                     .where(project_id: @project.id)
                     .where(tracker_id: 9)
                     .includes(:custom_values, :status)
  
      # Obtener valores únicos para los filtros de localidad
      @unique_locations = CustomValue.where(custom_field_id: 102)
                                   .where(customized_id: @issues.pluck(:id))
                                   .distinct.pluck(:value).compact.sort
      
      # Obtener valores únicos para los filtros de tipo de predio
      @unique_types = CustomValue.where(custom_field_id: 106)
                                .where(customized_id: @issues.pluck(:id))
                                .distinct.pluck(:value).compact.sort
  
      # Configurar variables para la vista
      @custom_field_ids = {
        latitud: 118,
        longitud: 117,
        localidad: 102,
        direccion: 105,
        tipo_predio: 106
      }
    end
  
    private
  
    def find_project
      @project = Project.find(params[:project_id])
    rescue ActiveRecord::RecordNotFound
      render_404
    end
  end