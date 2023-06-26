use rusqlite::{Connection, Result, Row};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct City {
    pub id: u8,
    pub name: String,
    pub lat: f32,
    pub lon: f32,
}

pub struct WeatherGenApp {
    pub conn: Connection,
    cities_amount: u8,
}

fn map_city(row: &Row) -> Result<City> {
    Ok(City {
        id: row.get(0)?,
        name: row.get(1)?,
        lat: row.get(2)?,
        lon: row.get(3)?,
    })
}

impl WeatherGenApp {
    pub fn new() -> Result<WeatherGenApp> {
        let db_path = "weather-gen.sqlite";
        let conn = Connection::open(db_path)?;

        let sql_code = include_str!("sql/create-table.sql");

        conn.execute(sql_code, [])?;

        Ok(WeatherGenApp {
            conn,
            cities_amount: 0,
        })
    }

    pub fn get_city(&self, id: String) -> Result<City> {
        let mut stmt = self.conn.prepare("SELECT * FROM Cities WHERE id = ?")?;

        let mut rows = stmt.query_map(&[&id], map_city)?;
        let city = rows.next().unwrap()?;

        Ok(city)
    }

    pub fn get_cities_list(&self) -> Result<Vec<City>> {
        let mut stmt = self.conn.prepare("SELECT * FROM Cities").unwrap();
        let cities_iter = stmt.query_map([], map_city)?;
        let mut cities: Vec<City> = Vec::new();

        for city in cities_iter {
            cities.push(city?);
        }

        Ok(cities)
    }

    pub fn new_city(&self, city: City) -> bool {
        let City { name, lat, lon, .. } = city;

        let mut cities_amount = 0u8;

        if let Ok(cities_list) = self.get_cities_list() {
            cities_amount = cities_list.len() as u8;
        }

        if cities_amount >= 5 {
            match self.conn.execute(
                "DELETE FROM Cities WHERE id = (SELECT MIN(id) FROM Cities)",
                [],
            ) {
                Ok(delete) => println!("{} row deleted", delete),
                Err(err) => {
                    println!("Error deleting row: {}", err);
                    return false;
                }
            }
        }

        match self.conn.execute(
            "INSERT INTO Cities (name, lat, lon) VALUES (?1, ?2, ?3)",
            [name, lat.to_string(), lon.to_string()],
        ) {
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
        let City { id, name, lat, lon } = city;

        match self.conn.execute(
            "UPDATE Cities SET name = ?1, lat = ?2, lon = ?3 WHERE id = ?4",
            [name, lat.to_string(), lon.to_string(), id.to_string()],
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
