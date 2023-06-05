import {useEffect, useState} from "react";

import { invoke } from "@tauri-apps/api/tauri";

import { initCanvasBgWebGPU } from "./components/canvas-bg/canvas-bg-webgpu";
import { initCanvasBgWebGL } from "./components/canvas-bg/canvas-bg-webgl";

import "./App.css";

function App() {
  const [cityName, setCityName] = useState("")
  const [citiesList, setState] = useState([])

  useEffect(() => {
      const canvas = document.getElementById("canvas") as HTMLCanvasElement;

      if (canvas) {
          if (navigator.gpu) {
              initCanvasBgWebGPU({ canvas })
          } else {
              initCanvasBgWebGL({ canvas })
          }
      }

      invoke('get_cities_list').then(console.log)
  }, [])

  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>

      <div className="row canvas-bg">
        <canvas id="canvas"></canvas>
      </div>

      <p>{navigator.userAgent}</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <input
          onChange={(e) => setCityName(e.currentTarget.value)}
          placeholder="Enter a city name..."
        />
        <button type="submit">Add City</button>
      </form>
    </div>
  );
}

export default App;
