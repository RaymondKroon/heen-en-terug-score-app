use std::collections::HashMap;
use std::fmt::Display;
use std::ops::Deref;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, LazyLock, Mutex};
use serde::{Serialize};
use web_time::Instant;
use crate::card::{create_hand_from_string, Card, Suit};
use crate::game::Game;
use wasm_bindgen::prelude::*;
use js_sys;
use wasm_bindgen_futures::JsFuture;
use web_sys::window;
use wasm_bindgen::closure::Closure;

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

// Global stop flag for the simulation
static STOP_SIMULATION: LazyLock<Mutex<AtomicBool>> = LazyLock::new(|| Mutex::new(AtomicBool::new(false)));

#[cfg(target_arch = "wasm32")]
async fn sleep(ms: i32) -> Result<(), JsValue> {
    JsFuture::from(js_sys::Promise::new(&mut |resolve, _| {
        window()
            .unwrap()
            .set_timeout_with_callback_and_timeout_and_arguments_0(
                Closure::once_into_js(move || resolve.call0(&JsValue::NULL).unwrap())
                    .as_ref()
                    .unchecked_ref(),
                ms,
            )
            .unwrap();
    }))
        .await
        .map(|_| ())
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub async fn simulate(input: String, callback: js_sys::Function) -> Result<Vec<JsValue>, SimulateError> {
    // Store the stop flag in the global variable
    STOP_SIMULATION.lock().unwrap().store(false, Ordering::SeqCst);

    // Create a callback wrapper that converts Rust Probability to JS
    let callback_wrapper = move |probabilities: Vec<Probability>| {
        let js_values: Result<Vec<JsValue>, _> = probabilities
            .iter()
            .map(|p| p.to_js_value())
            .collect();

        if let Ok(values) = js_values {
            let this = JsValue::null();
            let js_array = js_sys::Array::from_iter(values.iter());
            let _ = callback.call1(&this, &js_array);
        }
    };

    // Run the simulation with the callback and stop flag
    let final_result = simulate_impl(input, Some(callback_wrapper), || STOP_SIMULATION.lock().unwrap().load(Ordering::SeqCst)).await?;

    // Convert the final result to JS values
    final_result
        .iter()
        .map(|p| p.to_js_value())
        .collect()
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn stop_simulation() {
    STOP_SIMULATION.lock().unwrap().store(true, Ordering::SeqCst);
}

#[cfg(not(target_arch = "wasm32"))]
pub async fn simulate(input: String) -> Result<Vec<Probability>, SimulateError> {
    // set stop flag after 2 seconds
    let flag = Arc::new(AtomicBool::new(false));
    let mover = Arc::clone(&flag);
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_secs(2));
        mover.store(true, Ordering::SeqCst);
    });

    simulate_impl(input, Some(move |probabilities: Vec<Probability>| {println!("intermediate")}), move || flag.load(Ordering::SeqCst)).await
}

// parse the input string and simulate the game
// return the result as a string
// input example: "4p h 2s 4s"
// where 4p is the number of players, h is the trump suit, 2s 4s are the cards in the hand
// the trump suit can be x for no trump
// #[cfg(target_arch = "wasm32")]
async fn simulate_impl<Fc, Fs>(
    input: String,
    callback: Option<Fc>,
    stop: Fs,
) -> Result<Vec<Probability>, SimulateError>
where
    Fc: FnMut(Vec<Probability>),
    Fs: Fn() -> bool,
{
    let parts: Vec<&str> = input.split_whitespace().collect();
    if parts.len() < 3 {
        return Err(SimulateError::Error("Invalid input".to_string()));
    }

    let n_players: usize = parts[0].trim_end_matches('p').parse().unwrap_or(0);
    let trump = match parts[1] {
        "x" => None,
        _ => Some(parts[1].parse::<Suit>().unwrap()),
    };
    let player_cards = create_hand_from_string(&parts[2..].join(" "));

    let mut rng = rand::thread_rng();
    let mut counts = HashMap::new();

    let start_time = Instant::now();
    let mut last_callback_time = start_time;
    let callback_interval = std::time::Duration::from_millis(250);

    let mut i = 0;
    let mut callback = callback;
    let chunk_size = 10000; // Process 5 simulations per chunk

    loop {
        // Check if we should stop
        if stop() {
            break;
        }

        // Process a chunk of simulations
        for _ in 0..chunk_size {
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

        // Check if it's time to send an update
        let now = Instant::now();
        if now.duration_since(last_callback_time) >= callback_interval {
            if let Some(ref mut cb) = callback {
                let probabilities = calculate_probability(&counts, &player_cards, n_players, trump);
                cb(probabilities);
                last_callback_time = now;
            }

            #[cfg(target_arch = "wasm32")]
            {
                // Yield to the browser to keep the UI responsive
                // Use sleep to yield control back to the JavaScript event loop
                if let Err(e) = sleep(0).await {
                    return Err(SimulateError::Error(format!("Error yielding to browser: {:?}", e)));
                }
            }
        }
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
