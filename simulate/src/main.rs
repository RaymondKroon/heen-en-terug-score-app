use std::collections::{HashMap};
use simulate::card::{Card, Suit};
use simulate::game::{Game};

fn main() {
    let mut rng = rand::thread_rng();
    let n_players = 5;
    // let n_cards = 2;
    // let trump = Some(Suit::Spades);
    let trump = None;

    let mut cards = vec!["S2".into()];
    cards.sort();

    // keep stats
    let mut counts: HashMap<Stat, usize> = HashMap::new();
    let n_games = 250000;

    for _ in 0..n_games {
        let game = Game::new(n_players, trump, &mut rng, cards.len());
        for pid in 0..n_players {
            let mut g = game.clone();
            g.play_game(pid);
            let mut stats = Stat::from_game(&g);
            // if stats[0].cards == cards {
            //     println!("Found the cards: {:?}", stats[0]);
            // }
            for stat in stats.drain(..) {
                *counts.entry(stat).or_insert(0) += 1;
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

            println!("Stat: {:?} occurred {:.2}% (Total: {})", stat, percentage, count);
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