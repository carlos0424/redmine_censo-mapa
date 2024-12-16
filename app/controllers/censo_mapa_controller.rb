# app/controllers/censo_mapa_controller.rb
class CensoMapaController < ApplicationController
    before_action :find_project
    before_action :authorize
    
    def index
      @issues = Issue.open
                     .where(project_id: @project.id)
                     .where(tracker_id: 9)
                     .includes(:custom_values, :status)
  
      # Obtener las listas de los campos personalizados
      @localidad_field = CustomField.find(102)
      @tipo_predio_field = CustomField.find(106)
      
      # Obtener las opciones de las listas
      @localidades = @localidad_field.possible_values
      @tipos_predio = @tipo_predio_field.possible_values
  
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