#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use dotenv::dotenv;
use reqwest;
use std::env;
use tauri::Manager;
use tokio::sync::{mpsc, Mutex};
use tokio::time::{interval, Duration};
use tracing::info;
use tracing_subscriber;

mod weather;

use weather::{City, WeatherGenApp};

struct AppState {
    app: Mutex<WeatherGenApp>,
    inner: Mutex<mpsc::Sender<String>>,
}

// TODO: Change test to actual
async fn test_weather_api() -> Result<String, reqwest::Error> {
    let api_url = env::var("WEATHER_API_URL").unwrap();
    let api_key = env::var("WEATHER_API_KEY").unwrap();

    // London lat/lon
    let lat = "51.5073219";
    let lon = "-0.1276474";

    let url = format!("{}?lat={}&lon={}&appid={}", api_url, lat, lon, api_key);

    let response = reqwest::get(&url).await?.text().await?;

    Ok(response)
}

fn main() {
    dotenv().ok();

    tracing_subscriber::fmt::init();

    let app = WeatherGenApp::new().unwrap();

    let (async_proc_input_tx, async_proc_input_rx) = mpsc::channel(1);
    let (async_proc_output_tx, mut async_proc_output_rx) = mpsc::channel(1);

    tauri::Builder::default()
        .manage(AppState {
            inner: Mutex::new(async_proc_input_tx),
            app: Mutex::from(app),
        })
        .invoke_handler(tauri::generate_handler![js2rs, new_city, get_cities_list])
        .setup(|app| {
            // only include this code on debug builds
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }

            /* TEST:start Tauri async and rs2js/js2rs */
            tauri::async_runtime::spawn(async move {
                let mut interval = interval(Duration::from_secs(10 * 60));

                loop {
                    interval.tick().await;
                    println!("Doing something every two seconds");
                }
            });

            tauri::async_runtime::spawn(async move {
                async_process_model(async_proc_input_rx, async_proc_output_tx).await
            });

            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                loop {
                    if let Some(output) = async_proc_output_rx.recv().await {
                        match test_weather_api().await {
                            Ok(data) => {
                                println!("{}", &data);

                                rs2js(data, &app_handle);
                            }
                            Err(err) => eprintln!("Error: {}", err),
                        }
                    }
                }
            });
            /* TEST:end Tauri async and rs2js/js2rs */

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn rs2js<R: tauri::Runtime>(message: String, manager: &impl Manager<R>) {
    info!(?message, "rs2js");

    manager
        .emit_all("rs2js", format!("rust: {}", message))
        .unwrap();
}

#[tauri::command]
async fn js2rs(message: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    info!(?message, "js2rs");

    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(message)
        .await
        .map_err(|e| e.to_string())
}

async fn async_process_model(
    mut input_rx: mpsc::Receiver<String>,
    output_tx: mpsc::Sender<String>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    while let Some(input) = input_rx.recv().await {
        let output = input;
        output_tx.send(output).await?;
    }

    Ok(())
}

#[tauri::command]
async fn new_city(state: tauri::State<'_, AppState>, city: City) -> Result<bool, ()> {
    let mut app = state.app.lock().await;
    let result = app.new_city(city);

    Ok(result)
}

#[tauri::command]
async fn get_cities_list(state: tauri::State<'_, AppState>) -> Result<Vec<City>, ()> {
    let app = state.app.lock().await;
    let cities = app.get_cities_list().unwrap();

    println!("get_cities_list");

    Ok(cities)
}
