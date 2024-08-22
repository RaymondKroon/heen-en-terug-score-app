use std::collections::{HashMap, HashSet};
use std::fmt::Display;
use std::time::{Duration, Instant};
use simulate::card::{create_hand_from_string, Card, Suit};
use simulate::game::{Game};

fn main() {
    let mut rng = rand::thread_rng();
    let n_players = 5;
    // let n_cards = 2;
    let trump = Some(Suit::Spades);
    // let trump = None;

    let mut cards = create_hand_from_string("2s 4s");
    // let mut cards = create_hand_from_string("Kc 2s");
    cards.sort();

    // keep stats
    let mut counts: HashMap<Stat, usize> = HashMap::new();
    // let n_games = 250000;


    let duration = Duration::from_millis(2000);
    let start_time = Instant::now();

    let mut i= 0;

    let mut games: HashMap<usize, Vec<Game>> = HashMap::new();

    while Instant::now().duration_since(start_time) < duration {
        let game = Game::new(i, n_players, trump, &mut rng, cards.clone());
        for pid in 0..n_players {
            for reshuffle in [true, false].iter() {
                let mut g = game.clone();
                g.play_game(pid, *reshuffle);

                let mut stats = Stat::from_game(&g);
                // games.entry(g.seed).or_insert(Vec::new()).push(g);
                // if stats[0].cards == cards {
                //     println!("Found the cards: {:?}", stats[0]);
                // }
                for stat in stats.drain(..) {
                    *counts.entry(stat).or_insert(0) += 1;
                }
            }
        }

        i += 1;
    }

    for (seed, games) in games.iter_mut() {
        // if tricks are not the same keep
        let tricks = games.iter().map(|g| g.players[0].tricks).collect::<HashSet<usize>>();
        if tricks.len() > 1 {
            // when pos 1, 2, 3 has 0 and pos 4 has 1 (zero based)
            games.sort_by(|a, b| a.players[0].starting_position.cmp(&b.players[0].starting_position));
            if games[1].players[0].tricks == 0 && games[2].players[0].tricks == 0 && games[3].players[0].tricks == 0 && games[4].players[0].tricks == 1 {
                println!("Seed: {} Tricks: {:?}", seed, tricks);
                for g in games {
                    println!("Pos {} - Tricks: {}", g.players[0].starting_position + 1, g.players[0].tricks);
                    g.players.sort_by(|a, b| a.starting_position.cmp(&b.starting_position));
                    for p in &g.players {
                        println!("{}", p);
                    }
                }
            }
        }
    }

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

            println!("{} prob.: {:.2}% (Total: {})", stat, percentage, count);
        }
        println!();
    }
}

#[derive(Debug, PartialEq, Eq, Hash)]
struct Stat {
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