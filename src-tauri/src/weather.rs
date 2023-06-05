use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct City {
    pub id: String,
    pub name: String,
    pub lat: String,
    pub lon: String,
}

pub struct WeatherGenApp {
    pub conn: Connection,
}

impl WeatherGenApp {
    pub fn new() -> Result<WeatherGenApp> {
        let db_path = "weather-gen.sqlite";
        let conn = Connection::open(db_path)?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS Cities (
                id         varchar(64)     PRIMARY KEY,
                name       text            NOT NULL,
                lat        numeric         DEFAULT 0,
                lon        numeric         DEFAULT 0
            )",
            [],
        )?;
        Ok(WeatherGenApp { conn })
    }

    pub fn get_city(&self, id: String) -> Result<City> {
        let mut stmt = self.conn.prepare("SELECT * FROM Cities WHERE id = ?")?;
        let mut rows = stmt.query_map(&[&id], |row| {
            Ok(City {
                id: row.get(0)?,
                name: row.get(1)?,
                lat: row.get(2)?,
                lon: row.get(3)?,
            })
        })?;
        let city = rows.next().unwrap()?;

        Ok(city)
    }

    pub fn get_cities_list(&self) -> Result<Vec<City>> {
        let mut stmt = self.conn.prepare("SELECT * FROM Cities").unwrap();
        let cities_iter = stmt.query_map([], |row| {
            Ok(City {
                id: row.get(0)?,
                name: row.get(1)?,
                lat: row.get(2)?,
                lon: row.get(3)?,
            })
        })?;
        let mut cities: Vec<City> = Vec::new();

        for city in cities_iter {
            cities.push(city?);
        }

        Ok(cities)
    }

    pub fn new_city(&self, city: City) -> bool {
        let City { id, name, .. } = city;
        match self
            .conn
            .execute("INSERT INTO Cities (id, label) VALUES (?, ?)", [id, name])
        {
            Ok(insert) => {
                println!("{} row inserted", insert);
                true
            }
            Err(err) => {
                println!("some error: {}", err);
                false
            }
        }
    }

    pub fn update_city(&self, city: City) -> bool {
        let City {
            id,
            name,
            lat,
            lon,
        } = city;

        match self.conn.execute(
            "UPDATE Cities SET label = ?1, done = ?2, is_delete = ?3 WHERE id = ?4",
            [name, lat, lon, id],
        ) {
            Ok(update) => {
                println!("row {} has been update", update);
                true
            }
            Err(err) => {
                println!("some error: {}", err);
                false
            }
        }
    }
}
