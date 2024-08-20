#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Copy, Clone, Hash)]
pub enum Suit {
    Spades,
    Hearts,
    Diamonds,
    Clubs,
}

impl Suit {
    pub fn from_char(c: &str) -> Option<Self> {
        match c.to_uppercase().as_str() {
            "S" => Some(Suit::Spades),
            "H" => Some(Suit::Hearts),
            "D" => Some(Suit::Diamonds),
            "C" => Some(Suit::Clubs),
            _ => None,
        }
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


        let (suit_char, rank_str) = s.split_at(1);
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

        let suit_str = match self.suit {
            Suit::Spades => "S",
            Suit::Hearts => "H",
            Suit::Diamonds => "D",
            Suit::Clubs => "C",
        };

        format!("{}{}", suit_str, rank_str)
    }
}


pub fn all_cards() -> Vec<Card> {
    let mut cards = Vec::with_capacity(52);
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
            cards.push(Card {
                suit: *suit,
                rank: *rank,
            });
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

    let winning_suit = trump.or(cards.iter().next().map(|card| card.suit))?;
    let winner = cards
        .iter()
        .enumerate()
        .filter(|(_idx, card)| {
            card.suit == winning_suit
        })
        .max_by_key(|&(_,item)| item);
    winner
}