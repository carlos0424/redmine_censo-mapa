# Configuración de rutas para el plugin
RedmineApp::Application.routes.draw do
    get 'projects/:project_id/censo-mapa', to: 'censo_mapa#index'
  end