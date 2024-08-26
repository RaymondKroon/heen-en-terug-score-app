use std::fmt::Display;
use std::str::FromStr;
use colored::*;

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Copy, Clone, Hash)]
pub enum Suit {
    Spades,
    Hearts,
    Diamonds,
    Clubs,
}

impl Suit {
    pub fn from_char(c: &str) -> Option<Self> {
        match c.to_lowercase().as_str() {
            "s" => Some(Suit::Spades),
            "h" => Some(Suit::Hearts),
            "d" => Some(Suit::Diamonds),
            "c" => Some(Suit::Clubs),
            _ => None,
        }
    }
}

impl FromStr for Suit {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::from_char(s).ok_or(())
    }
}

impl Display for Suit {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        let suit_str = match self {
            Suit::Spades => "♠".black(),
            Suit::Hearts => "♥".red(),
            Suit::Diamonds => "♦".blue(),
            Suit::Clubs => "♣".green(),
        };
        write!(f, "{}", suit_str)
    }
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Copy, Clone, Hash)]
pub enum Rank {
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    Ten,
    Jack,
    Queen,
    King,
    Ace,
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Clone, Hash)]
pub struct Card {
    pub suit: Suit,
    pub rank: Rank,
}

impl Rank {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_uppercase().as_str() {
            "2" => Some(Rank::Two),
            "3" => Some(Rank::Three),
            "4" => Some(Rank::Four),
            "5" => Some(Rank::Five),
            "6" => Some(Rank::Six),
            "7" => Some(Rank::Seven),
            "8" => Some(Rank::Eight),
            "9" => Some(Rank::Nine),
            "10" => Some(Rank::Ten),
            "J" => Some(Rank::Jack),
            "Q" => Some(Rank::Queen),
            "K" => Some(Rank::King),
            "A" => Some(Rank::Ace),
            _ => None,
        }
    }
}

impl From<&str> for Card {
    fn from(s: &str) -> Self {
        Card::from_string(s).unwrap()
    }
}

impl Card {
    pub fn from_string(s: &str) -> Option<Self> {
        if s.len() < 2 {
            return None;
        }


        let (rank_str, suit_char) = s.split_at(s.len() - 1);
        let suit = Suit::from_char(suit_char)?;

        let rank = Rank::from_str(rank_str)?;

        Some(Card { rank, suit })
    }

    pub fn to_string(&self) -> String {
        let rank_str = match self.rank {
            Rank::Two => "2",
            Rank::Three => "3",
            Rank::Four => "4",
            Rank::Five => "5",
            Rank::Six => "6",
            Rank::Seven => "7",
            Rank::Eight => "8",
            Rank::Nine => "9",
            Rank::Ten => "10",
            Rank::Jack => "J",
            Rank::Queen => "Q",
            Rank::King => "K",
            Rank::Ace => "A",
        };

        format!("{}{}", rank_str, self.suit)
    }
}


impl Display for Card {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{}", self.to_string())
    }
}

pub fn create_deck(without: &Vec<Card>) -> Vec<Card> {
    let mut cards = Vec::with_capacity(52 - without.len());
    for suit in [Suit::Spades, Suit::Hearts, Suit::Diamonds, Suit::Clubs].iter() {
        for rank in [
            Rank::Two,
            Rank::Three,
            Rank::Four,
            Rank::Five,
            Rank::Six,
            Rank::Seven,
            Rank::Eight,
            Rank::Nine,
            Rank::Ten,
            Rank::Jack,
            Rank::Queen,
            Rank::King,
            Rank::Ace,
        ]
            .iter()
        {
            let card = Card {
                suit: *suit,
                rank: *rank,
            };

            if without.contains(&card) {
                continue;
            }

            cards.push(card);
        }
    }
    cards
}

// return the highest ranked card in a list of cards with optional trump suit
// if no the highest rank of the first suit in the list is returned
pub fn highest_card(cards: &Vec<Card>, trump: Option<Suit>) -> Option<(usize, &Card)> {
    if cards.is_empty() {
        return None;
    }

    let winning_suit = match trump {
        Some(suit) if {cards.iter().any(|c| c.suit == suit )} => suit,
        _ => cards.first()?.suit,
    };

    let winner = cards
        .iter()
        .enumerate()
        .filter(|(_idx, card)| {
            card.suit == winning_suit
        })
        .max_by_key(|&(_,item)| item);
    winner
}

pub fn create_hand_from_string(s: &str) -> Vec<Card> {
    s.split_whitespace().map(|s| Card::from_string(s).unwrap()).collect()
}