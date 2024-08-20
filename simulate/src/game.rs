use rand::prelude::SliceRandom;
use rand::rngs::ThreadRng;
use crate::card::{all_cards, highest_card, Card, Suit};

#[derive(Debug, Clone)]
pub struct Player {
    pub starting_position: usize,
    hand: Vec<Card>,
    pub played: Vec<Card>,
    pub tricks: usize,
}

impl Player {
    pub fn new(starting_position: usize) -> Self {
        Player {
            starting_position,
            hand: Vec::with_capacity(10),
            tricks: 0,
            played: Vec::with_capacity(10),
        }
    }

    pub fn add_card(&mut self, card: Card) {
        self.hand.push(card);
    }

    pub fn play_card(&mut self, previous_cards: &Vec<Card>, trump: Option<Suit>) -> Option<Card> {
        if previous_cards.is_empty() {
            // If no previous cards, play any card
            return self.hand.pop().map(|card| {
                self.played.push(card.clone());
                card
            });
        }

        let first_suit = previous_cards.first()?.suit;
        if let Some(card) = self.hand.iter().find(|&card| card.suit == first_suit).cloned() {
            self.hand.retain(|c| c != &card);
            self.played.push(card.clone());
            Some(card)
        } else {
            let trumped = trump.map(|trump| previous_cards.first().unwrap().suit != trump && previous_cards.iter().any(|c|c.suit == trump)).unwrap_or(false);
            if trumped {
                let highest_trump = previous_cards.iter().filter(|c| c.suit == trump.unwrap()).max_by_key(|c| c.rank).unwrap();
                // if next card is no trump, play the card. if the next card is a trump and higher, play the card. if the next card is a trump and lower, pick the next card
                let card = self.hand.iter().find(|&card| card.suit == trump.unwrap() && card.rank > highest_trump.rank)
                    .or_else(|| self.hand.iter().find(|&card| card.suit != trump.unwrap()))
                    .or_else(|| self.hand.first()).cloned()?;
                self.hand.retain(|c| c != &card);
                self.played.push(card.clone());
                Some(card)

            } else {
                self.hand.pop().map(|card| {
                    self.played.push(card.clone());
                    card
                })
            }
        }
    }
}

#[derive(Debug, Clone)]
pub struct Game {
    pub players: Vec<Player>,
    n_players: usize,
    current_player: usize,
    pub trump: Option<Suit>,
    played: bool
}

impl Game {
    pub fn new(n_players: usize, trump: Option<Suit>, rng: &mut ThreadRng, n_cards: usize) -> Self {
        let players = (0..n_players)
            .map(|i| Player::new(i)).collect();
        let mut game = Game {
            players,
            n_players,
            current_player: 0,
            trump,
            played: false,
        };

        let mut deck = all_cards();
        deck.shuffle(rng);
        game.deal_cards(&mut deck, n_cards);

        game
    }

    fn deal_cards(&mut self, deck: &mut Vec<Card>, n_cards: usize) {
        for player in &mut self.players {
            for _ in 0..n_cards {
                if let Some(card) = deck.pop() {
                    player.add_card(card);
                }
            }
        }
    }

    fn play_trick(&mut self) -> Option<(usize, &Player)> {
        let mut trick: Vec<Card> = Vec::new();
        let mut player_order: Vec<usize> = Vec::new();
        for i in 0..self.players.len() {
            let player_index = (self.current_player + i) % self.players.len();
            if let Some(card) = self.players[player_index].play_card(&trick, self.trump) {
                player_order.push(player_index);
                trick.push(card);
            }
        }

        let winner= highest_card(&trick, self.trump);

        if let Some((winner_index, _card)) = winner {
            self.current_player = player_order[winner_index];

            /*if trick.first().unwrap().to_string() == "SA" && self.current_player != 0 && player_order[0] == 0 {
                println!("Found the cards: {:?}", trick);
                println!("Winner: {}", winner_index);
                println!("Player order: {:?}", player_order);
                println!("Current player: {}", self.current_player);
            }*/

            Some((self.current_player, &self.players[winner_index]))
        } else {
            None
        }
    }

    pub fn play_game(&mut self, starting_player: usize) {
        if self.played {
            panic!("Game has already been played");
        }
        self.played = true;
        self.current_player = starting_player;

        // set starting positions
        for i in 0..self.n_players {
            self.players[(i + starting_player) % self.n_players].starting_position = i;
        }

        while self.players.iter().any(|player| !player.hand.is_empty()) {
            if let Some((winner_idx, _winner)) = self.play_trick() {
                { self.players[winner_idx].tricks += 1; }
            }
        }
    }
}