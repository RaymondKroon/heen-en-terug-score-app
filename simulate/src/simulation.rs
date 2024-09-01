use std::collections::HashMap;
use std::fmt::Display;
use serde::{Serialize};
use web_time::Instant;
use crate::card::{create_hand_from_string, Card, Suit};
use crate::game::Game;
use wasm_bindgen::prelude::*;

#[derive(Debug)]
pub enum SimulateError {
    Error(String),
}

impl Display for SimulateError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Error(msg) => write!(f, "{}", msg)
        }
    }
}

impl <E>From<E> for SimulateError
where E: std::error::Error {
    fn from(e: E) -> Self {
        SimulateError::Error(format!("{:?}", e))
    }
}

impl Into<JsValue> for SimulateError {
    fn into(self) -> JsValue {
        JsValue::from_str(&self.to_string())
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn simulate(input: String) -> Result<Vec<JsValue>, SimulateError> {
    simulate_impl(input)?
        .iter()
        .map(|p| p.to_js_value())
        .collect()
}

#[cfg(not(target_arch = "wasm32"))]
pub fn simulate(input: String) -> Result<Vec<Probability>, SimulateError> {
    simulate_impl(input)
}

// parse the input string and simulate the game
// return the result as a string
// input example: "4p h 2s 4s"
// where 4p is the number of players, h is the trump suit, 2s 4s are the cards in the hand
// the trump suit can be x for no trump
// can also specify the duration of the simulation in seconds with the format "(n)s 4p h 2s 4s"
fn simulate_impl(input: String) -> Result<Vec<Probability>, SimulateError> {
    let parts: Vec<&str> = input.split_whitespace().collect();
    if parts.len() < 3 {
        return Err(SimulateError::Error("Invalid input".to_string()));
    }

    let mut duration = std::time::Duration::from_secs(2); // Default duration
    let mut start_index = 0;

    if parts[0].starts_with('(') && parts[0].ends_with("s)") {
        if let Ok(d) = parts[0][1..parts[0].len()-2].parse::<u64>() {
            duration = std::time::Duration::from_secs(d);
            start_index = 1;
        }
    }

    if parts.len() - start_index < 3 {
        return Err(SimulateError::Error("Invalid input".to_string()));
    }

    let n_players: usize = parts[start_index].trim_end_matches('p').parse().unwrap_or(0);
    let trump = match parts[start_index + 1] {
        "x" => None,
        _ => Some(parts[start_index + 1].parse::<Suit>().unwrap()),
    };
    let player_cards = create_hand_from_string(&parts[start_index + 2..].join(" "));

    let mut rng = rand::thread_rng();
    let mut counts = HashMap::new();

    let start_time = Instant::now();

    let mut i = 0;

    while Instant::now().duration_since(start_time) < duration {
        let game = Game::new(i, n_players, trump, &mut rng, player_cards.clone());
        for pid in 0..n_players {
            for reshuffle in [true, false].iter() {
                let mut g = game.clone();
                g.play_game(pid, *reshuffle);

                let mut stats = Stat::from_game(&g);
                for stat in stats.drain(..) {
                    *counts.entry(stat).or_insert(0) += 1;
                }
            }
        }

        i += 1;
    }

    Ok(calculate_probability(&counts, &player_cards, n_players, trump))
}

pub fn format_probabilities(probabilities: &Vec<Probability>) -> String {
    let mut result = String::new();
    for p in probabilities {
        result.push_str(&format!("Probabilities pos {}:\n", p.starting_position));
        result.push_str(&format!(" {}: {:.2}%\n", p.tricks, p.percentage));
        result.push_str(&format!("Simulations: {}\n", p.count));
    }
    result
}

fn calculate_probability(counts: &HashMap<Stat, usize>, player_cards: &Vec<Card>, n_players: usize, trump: Option<Suit>) -> Vec<Probability> {
    let mut probabilities = Vec::new();
    let mut cards = player_cards.clone();
    cards.sort();
    for starting_position in 0..n_players {
        let mut total_count = 0;
        let mut stat = Stat {
            cards: cards.clone(),
            starting_position,
            tricks: 0,
            trump,
        };

        for trick_count in 0..=cards.len() {
            stat.tricks = trick_count;
            if let Some(count) = counts.get(&stat) {
                total_count += count;
            }
        }

        for trick_count in 0..=cards.len() {
            stat.tricks = trick_count;
            let count = counts.get(&stat).unwrap_or(&0);
            let percentage = if total_count > 0 {
                (*count as f64 / total_count as f64) * 100.0
            } else {
                0.0
            };

            let prob = Probability {
                n_players,
                starting_position,
                tricks: trick_count,
                percentage,
                count: *count,
            };

            probabilities.push(prob);

        }
    }

    probabilities
}


#[derive(Debug, Serialize)]
pub struct Probability {
    pub n_players: usize,
    pub starting_position: usize,
    pub tricks: usize,
    pub percentage: f64,
    pub count: usize,
}

impl Probability {
    #[cfg(target_arch = "wasm32")]
    fn to_js_value(&self) -> Result<JsValue, SimulateError> {
        let result = serde_wasm_bindgen::to_value(self);
        match result {
            Ok(value) => Ok(value),
            Err(e) => Err(SimulateError::Error(format!("{:?}", e)))
        }
    }
}

#[derive(Debug, PartialEq, Eq, Hash, Clone)]
pub struct Stat {
    cards: Vec<Card>,
    starting_position: usize,
    tricks: usize,
    trump: Option<Suit>,
}

impl Display for Stat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s_trump = match self.trump {
            Some(trump) => format!("{}", trump),
            None => "no".to_string(),
        };

        let s_cards = self.cards.iter().map(|card| format!("{}", card)).collect::<Vec<String>>().join(" ");

        write!(f, "p{} - {} with {} trump  ==> {} tricks", self.starting_position+1, s_cards, s_trump, self.tricks)
    }
}

impl Stat {
    fn from_game(game: &Game) -> Vec<Stat> {
        let mut stats = Vec::new();
        for player in &game.players {
            let mut cards = player.played.clone();
            cards.sort();
            stats.push(Stat {
                cards,
                starting_position: player.starting_position,
                tricks: player.tricks,
                trump: game.trump,
            });
        }
        stats
    }
}