import { useEffect, useState } from "react";

import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";

import { initCanvasBgWebGPU } from "./components/canvas-bg/canvas-bg-webgpu";
import { initCanvasBgWebGL } from "./components/canvas-bg/canvas-bg-webgl";

import "./App.css";

if (window.__TAURI__) {
  // let permissionGranted = await isPermissionGranted();
  // console.log("permissionGranted: ", permissionGranted);
  // if (!permissionGranted) {
  //   const permission = await requestPermission();
  //   permissionGranted = permission === "granted";
  // }
  // if (permissionGranted) {
  //   sendNotification("Tauri is awesome!");
  //   sendNotification({ title: "TAURI", body: "Tauri is awesome!" });
  // }
}

const GEO_URL = import.meta.env.VITE_GEOLOCATION_API_URL;
const WEATHER_URL = import.meta.env.VITE_WEATHER_API_URL;
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

function App() {
  const [cityName, setCityName] = useState("");
  const [weatherList, setWeatherList] = useState<any[]>([]);
  const [selectedWeather, setSelectedWeather] = useState<any>();

  const getWeatherList = async () => {
    const citiesList = (await invoke("get_cities_list")) as any[];

    setWeatherList(
      citiesList.map((city) => {
        const { id, name } = city as any;

        return { id, name, temp: "", weather: null };
      })
    );

    const weatherList = await Promise.allSettled(
      citiesList.map((city) => {
        const weatherURL = `${WEATHER_URL}?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}`;

        return fetch(weatherURL).then((res) => res.json());
      })
    );

    const fulfilledList = weatherList
      .filter((weather) => weather.status === "fulfilled")
      .map((weather) => {
        const {
          id,
          name,
          main: { temp },
          weather: [{ main, icon }],
        } = (weather as any).value;

        return { id, name, temp, weather: { name: main, icon } };
      });

    setWeatherList(fulfilledList);
  };

  useEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    if (canvas) {
      if (navigator.gpu) {
        console.log("WebGPU init");
        initCanvasBgWebGPU({ canvas }).finally();
      } else {
        console.log("WebGL init");
        initCanvasBgWebGL({ canvas });
      }
    }

    getWeatherList().finally();

    listen("rs2js", (event) => {
      if (event.payload) {
        const strData = (event.payload as string).slice(3);
        const data = JSON.parse(strData);

        console.log("rs2js data: ", data);
      }
    }).catch(console.error);
  }, []);

  const handleChange = (ev: any) => setCityName(ev.currentTarget.value);
  const handleCitySubmit = async (ev: any) => {
    ev.preventDefault();

    try {
      const geoURL = `${GEO_URL}?q=${cityName}&limit=${"1"}&appid=${API_KEY}`;

      const [{ lat, lon }] = await fetch(geoURL).then((res) => res.json());

      const isAdded = await invoke("new_city", {
        city: { id: 1, name: cityName, lat, lon },
      });

      if (isAdded) {
        setCityName("");
        getWeatherList().finally();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container">
      <div className="canvas-bg">
        <canvas id="canvas"></canvas>
      </div>

      <div className="content">
        <h1>Weather App</h1>

        <p style={{ padding: "8px 0" }}>{navigator.userAgent}</p>

        <form className="city-form" onSubmit={handleCitySubmit}>
          <input
            value={cityName}
            placeholder="Enter a city name..."
            onChange={handleChange}
          />
          <button type="submit">Add City</button>
        </form>

        <div className="weather-list">
          {weatherList.map((weather) => {
            const handleSelect = () => {
              setSelectedWeather(weather);
            };

            return (
              <div
                key={weather.id}
                className="weather-item"
                style={{
                  backgroundColor:
                    weather.id === selectedWeather?.id
                      ? "#ddd"
                      : "rgba(255, 255, 255, 0.8)",
                }}
                onClick={handleSelect}
              >
                <div className="weather-item-wrapper">
                  <p className="weather-item-text">
                    {weather.name} - {weather.temp}
                  </p>
                  {weather.weather && (
                    <div className="weather-item-wrapper">
                      {weather.weather.name}
                      <img
                        src={`https://openweathermap.org/img/wn/${weather.weather.icon}.png`}
                        alt={weather.weather.name}
                      />
                    </div>
                  )}
                </div>

                <button className="weather-item-button" onClick={() => {}}>
                  X
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
