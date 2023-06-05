#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod weather;

use std::io::Read;
use std::sync::Mutex;
use tauri::Manager;
use tauri::regex::internal::Input;
use weather::{City, WeatherGenApp};

struct AppState {
    app: Mutex<WeatherGenApp>,
}

fn main() {
    let app = WeatherGenApp::new().unwrap();
    tauri::Builder::default()
        .manage(AppState {
            app: Mutex::from(app),
        })
        .invoke_handler(tauri::generate_handler![
            get_city,
            get_cities_list,
            new_city,
            update_city
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_city(state: tauri::State<AppState>, city_id: String) -> City {
    let app = state.app.lock().unwrap();
    let cities = app.get_city(city_id).unwrap();

    cities
}

#[tauri::command]
fn get_cities_list(state: tauri::State<AppState>) -> Vec<City> {
    let app = state.app.lock().unwrap();
    let cities = app.get_cities_list().unwrap();

    cities
}

#[tauri::command]
fn new_city(state: tauri::State<AppState>, city: City) -> bool {
    let app = state.app.lock().unwrap();
    let result = app.new_city(city);

    result
}

#[tauri::command]
fn update_city(state: tauri::State<AppState>, city: City) -> bool {
    let app = state.app.lock().unwrap();
    let result = app.update_city(city);

    result
}
