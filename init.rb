require 'redmine'

Redmine::Plugin.register :redmine_censo_mapa do
  name 'Mapa de Censo'
  author 'Carlos Arbelaez'
  description 'Plugin para visualización de mapas y ubicaciones de censo'
  version '1.0.0'
  url 'https://github.com/carlos0424/redmine_censo-mapa'
  author_url 'https://github.com/carlos0424'
  
  # Permisos específicos para el módulo
  project_module :censo_mapa do
    permission :view_censo_mapa, { 
      censo_mapa: [:index, :show]
    }
  end
  
  # Menú que solo aparece en el proyecto CENSO (ID: 2)
  menu :project_menu,
       :censo_mapa,
       { controller: 'censo_mapa', action: 'index' },
       caption: 'Mapa Censo',
       param: :project_id,
       if: Proc.new { |p| p.id == 2 }
end