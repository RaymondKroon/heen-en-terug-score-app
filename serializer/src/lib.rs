#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(clippy::unusual_byte_groupings)]

use std::collections::HashMap;
use std::fmt::{Display, format};
use deku::prelude::*;
use paste::paste;
use serde::{Serialize, Deserialize};
use wasm_bindgen::prelude::*;


#[derive(Debug)]
pub enum SerializeError {
    Error(String),
}

impl Display for SerializeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SerializeError::Error(msg) => write!(f, "{}", msg)
        }
    }
}

impl <E>From<E> for SerializeError where E: std::error::Error {
    fn from(e: E) -> Self {
        SerializeError::Error(format!("{:?}", e))
    }
}

impl Into<JsValue> for SerializeError {
    fn into(self) -> JsValue {
        JsValue::from_str(&self.to_string())
    }
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);
}

#[wasm_bindgen]
pub fn serialize(val: JsValue) -> Result<Vec<u8>, SerializeError> {
    let result  = JsGame::from_js_value(val);
    match result {
        Ok(js_game) => {
            let game = Game::from(js_game);
            let serialized: Vec<u8> = game.try_into().unwrap();
            return Ok(serialized);
        },
        Err(e) => {
            error(&format!("{}", e));
            return Err(e);
        }
    }
}

#[wasm_bindgen]
pub fn deserialize(data: Vec<u8>) -> Result<JsValue, SerializeError> {
    let (_, game) = Game::from_bytes((&data, 0)).unwrap();

    let js_game: JsGame = game.into();
    let js_value = js_game.to_js_value()?;
    Ok(js_value)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsGame {
    pub game_version: u8,
    pub name: String,
    pub players: Vec<JsPlayer>,
    pub rounds: Vec<JsRound>,
}

impl JsGame {
    fn from_js_value(val: JsValue) -> Result<Self, SerializeError> {
        let result = serde_wasm_bindgen::from_value(val);
        match result {
            Ok(js_game) => Ok(js_game),
            Err(e) => Err(SerializeError::from(e))
        }
    }

    fn to_js_value(&self) -> Result<JsValue, SerializeError> {
        let result = serde_wasm_bindgen::to_value(self);
        match result {
            Ok(js_value) => Ok(js_value),
            Err(e) => Err(SerializeError::from(e))
        }
    }
}

impl From<JsGame> for Game {
    fn from(value: JsGame) -> Self {
        let mut players = Vec::new();
        let n_players = value.players.len() as u8;

        for player in &value.players {
            let name_bytes = player.name.clone().into_bytes();
            players.push(Player {
                name_length: name_bytes.len() as u8,
                name: name_bytes
            })
        }

        let mut current_round = 1;

        let mut trumps: Vec<Trump> = Vec::new();
        let mut player_bids: Vec<PlayerScore> = Vec::with_capacity(5);
        for _ in 0..n_players {
            player_bids.push(PlayerScore::default());
        }

        let mut tricks = AllTricks::default();

        for (round_index, round) in value.rounds.iter().enumerate() {
            trumps.push(round.trump.into());

            if round.bids.len() == n_players as usize {
                current_round = round_index as u8 + 1;
            }

            if round.tricks.len() == n_players as usize {
                current_round = round_index as u8 + 2;
            }

            for i in 0..n_players {
                let bids = player_bids.get_mut(i as usize).unwrap();
                bids.set_round(round_index as u8 + 1, *round.bids.get(i as usize).unwrap_or(&0u8));
            }

            tricks[(round_index as u8) + 1] = serialize_tricks(&round.tricks);

        }

        let n_rounds = value.rounds.len() as u8;
        let name_bytes = value.name.clone().into_bytes();
        Game {
            name_length: name_bytes.len() as u8,
            name: name_bytes,
            n_players,
            players,
            start_dealer: value.rounds[0].dealer_id,
            n_rounds,
            current_round,
            trumps,
            player_bids,
            tricks
        }
    } 
}

impl From<Game> for JsGame {
    fn from(value: Game) -> Self {
        let mut players = Vec::new();
        let mut id = 0;
        for player in value.players {
            let name = String::from_utf8(player.name).unwrap();
            players.push(JsPlayer {
                id,
                name
            });

            id+=1;
        }

        let mut rounds = Vec::new();
        let mut dealer_id = value.start_dealer;
        let cards_per_round = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        for (round_index, trump) in value.trumps.iter().enumerate() {
            let mut bids = Vec::new();
            let mut tricks = Vec::new();
            for player in 0..value.n_players {
                if round_index + 1 <= value.current_round as usize {
                    bids.push(value.player_bids[player as usize].get_round(round_index as u8 + 1));
                }

            }

            if round_index + 1 < value.current_round as usize {
                tricks = deserialize_tricks(&value.tricks[round_index as u8 + 1]);
            }

            rounds.push(JsRound {
                n_cards: cards_per_round[round_index],
                trump: trump.clone() as u8,
                bids,
                tricks,
                dealer_id
            });

            dealer_id = (dealer_id + 1) % value.n_players;
        }

        JsGame {
            game_version: 3,
            name: String::from_utf8(value.name).unwrap(),
            players,
            rounds
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsPlayer {
    pub id: u8,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsRound {
    pub n_cards: u8,
    pub trump: u8,
    pub bids: Vec<u8>,
    pub tricks: Vec<u8>,
    pub dealer_id: u8
}

#[derive(Clone, Debug, PartialEq, DekuRead, DekuWrite)]
#[deku(type= "u8", bits = "3")]
enum Trump {
    #[deku(id = "0b00")]
    Spade,
    #[deku(id = "0b01")]
    Heart,
    #[deku(id = "0b10")]
    Club,
    #[deku(id = "0b11")]
    Diamond,
    #[deku(id = "0b100")]
    None
}

impl From<u8> for Trump {
    fn from(value: u8) -> Self {
        match value {
            0 => Trump::Spade,
            1 => Trump::Heart,
            2 => Trump::Club,
            3 => Trump::Diamond,
            4 => Trump::None,
            _ => panic!("Invalid trump value: {}", value)
        }
    }
}

#[derive(Clone, Debug, PartialEq, DekuRead, DekuWrite)]
struct Player {
    #[deku(update = "self.name.len()")]
    name_length: u8,
    #[deku(count = "name_length")]
    name: Vec<u8>,
}


#[derive(Debug, PartialEq, DekuRead, DekuWrite)]
struct Game {
    name_length: u8,
    #[deku(count = "name_length")]
    name: Vec<u8>,
    #[deku(bits = "3")]
    n_players: u8,
    #[deku(count = "n_players")]
    players: Vec<Player>,
    #[deku(bits = "3")]
    start_dealer: u8,
    #[deku(bits="5")]
    n_rounds: u8, // should be 19
    #[deku(bits = "5")]
    current_round: u8,
    #[deku(count = "n_rounds")]
    trumps: Vec<Trump>,
    #[deku(count = "n_players")]
    player_bids: Vec<PlayerScore>,
    tricks: AllTricks

}

fn calculate_needed_bits(n: u8) -> u8 {
    let mut bits = 0;
    let mut n = n;
    while n > 0 {
        bits += 1;
        n >>= 1;
    }
    bits
}

macro_rules! zero_nonzero {
    ($round:tt, $bits:tt) => {
        use deku::prelude::*;

    paste::paste! {
        #[derive(Debug, Clone, Default, PartialEq, DekuRead, DekuWrite)]
        #[deku(type = "u8", bits = "1")]
        pub enum [<Value$round>] {
            #[default]
            #[deku(id = "0")]
            Zero,
            #[deku(id = "1")]
            NonZero(#[deku(bits = $bits)] u8)
        }
        impl From<u8> for [<Value$round>] {
            fn from(value: u8) -> Self {
                match value {
                    0 => [<Value$round>]::Zero,
                    _ => [<Value$round>]::NonZero(value - 1)
                }
            }
        }

        impl From<[<Value$round>]> for u8 {
            fn from(value: [<Value$round>]) -> Self {
                match value {
                    [<Value$round>]::Zero => 0,
                    [<Value$round>]::NonZero(v) => v + 1
                }
            }
        }
    }
    }
}

macro_rules! max_three_or_higher {
    ($round:tt, $bits:tt) => {
        use deku::prelude::*;

    paste::paste! {
        #[derive(Debug, Clone, PartialEq, DekuRead, DekuWrite)]
        #[deku(type = "u8", bits = "1")]
        pub enum [<Value$round>] {
            #[deku(id = "0")]
            MaxThree(#[deku(bits = "2")] u8),
            #[deku(id = "1")]
            Higher(#[deku(bits = $bits)] u8)
        }

        impl Default for [<Value$round>] {
            fn default() -> Self {
                [<Value$round>]::MaxThree(0)
            }
        }

        impl From<u8> for [<Value$round>] {
            fn from(value: u8) -> Self {
                match value {
                    0..=3 => [<Value$round>]::MaxThree(value),
                    _ => [<Value$round>]::Higher(value - 3)
                }
            }
        }
        impl From<[<Value$round>]> for u8 {
            fn from(value: [<Value$round>]) -> Self {
                match value {
                    [<Value$round>]::MaxThree(v) => v,
                    [<Value$round>]::Higher(v) => v + 3
                }
            }
        }
    }
    }
}

macro_rules! tailored_enum {
    (1) => { // 10
        max_three_or_higher!(1, 3);
    };
    (2) => { // 9
        max_three_or_higher!(2, 3);
    };
    (3) => { // 8
        max_three_or_higher!(3, 3);
    };
    (4) => { // 7
        max_three_or_higher!(4, 3);
    };
    (5) => { // 6
        max_three_or_higher!(5, 2);
    };
    (6) => { // 5
        zero_nonzero!(6, 3);
    };
    (7) => { // 4
        zero_nonzero!(7, 2);
    };
    (8) => { // 3
        zero_nonzero!(8, 2);
    };
    (9) => { // 2
        zero_nonzero!(9, 1);
    };
    (10) => { // 1
        zero_nonzero!(10, 1);
    };
    (11) => { // 2
        zero_nonzero!(11, 1);
    };
    (12) => { // 3
        zero_nonzero!(12, 2);
    };
    (13) => { // 4
        zero_nonzero!(13, 2);
    };
    (14) => { // 5
        zero_nonzero!(14, 3);
    };
    (15) => { // 6
        max_three_or_higher!(15, 2);
    };
    (16) => { // 7
        max_three_or_higher!(16, 3);
    };
    (17) => { // 8
        max_three_or_higher!(17, 3);
    };
    (18) => { // 9
        max_three_or_higher!(18, 3);
    };
    (19) => { // 10
        max_three_or_higher!(19, 3);
    };
}

macro_rules! player_score {
    ($name:ident [ $($round_id:tt),* ]) => {
        paste! {
            use deku::prelude::*;
            use std::ops::{Index, IndexMut};

            mod [<values_$name:lower>] {
                $(
                tailored_enum!($round_id);
                )*
            }

            #[derive(Debug, Default, PartialEq, DekuRead, DekuWrite)]
            pub struct $name {
            $(
            pub [<round_$round_id>]: [<values_$name:lower>]::[<Value$round_id>],
            )*
            }

            impl $name {
                pub fn get_round(&self, index: u8) -> u8 {
                    let result: u8 = match index {
                        $( $round_id => self.[<round_$round_id>].clone().into(), )*
                        _ => panic!("Invalid index: {}", index)
                    };
                    result
                }

                pub fn set_round(&mut self, index: u8, value: u8) {
                    match index {
                        $( $round_id => self.[<round_$round_id>] = value.into(), )*
                        _ => panic!("Invalid index: {}", index)
                    }
                }
            }
        }
    }
}

player_score!(PlayerScore
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
     11, 12, 13, 14, 15, 16, 17, 18, 19]);


macro_rules! variable_bit_array {
    ($name:ident $type:ident [ $(($round_id:tt, $bits:tt)),* ]) => {
        paste! {
            use deku::prelude::*;

            #[derive(Debug, Default, PartialEq, DekuRead, DekuWrite)]
            #[deku(endian="big")]
            pub struct $name {
            $(
            #[deku(bits = $bits)]
            pub [<round_$round_id>]: $type,
            )*
            }

            impl std::ops::Index<u8> for $name {
                type Output = $type;
                fn index(&self, index: u8) -> &Self::Output {
                    match index {
                        $( $round_id => &self.[<round_$round_id>], )*
                        _ => panic!("Invalid index: {}", index)
                    }
                }
            }

            impl std::ops::IndexMut<u8> for $name {
                fn index_mut(&mut self, index: u8) -> &mut Self::Output {
                    match index {
                        $( $round_id => &mut self.[<round_$round_id>], )*
                        _ => panic!("Invalid index: {}", index)
                    }
                }
            }
        }
    }
}

// for 5 players
variable_bit_array!(AllTricks u16
    [(1, 15), (2, 14), (3, 13), (4, 12), (5, 11), (6, 10),
        (7, 9), (8, 8), (9, 7), (10, 6), (11, 7), (12, 8), (13, 9),
        (14, 10), (15, 11), (16, 12), (17, 13), (18, 14), (19, 15)]);


fn serialize_tricks(tricks: &Vec<u8>) -> u16 {
    let mut result = 1;
    let mut first = true;
    for trick in tricks.iter() {
        if !first {
            result <<= 1;
        }
        first = false;
        result |= 1;
        result <<= *trick;
    }
    result
}

fn deserialize_tricks(serialized_tricks: &u16) -> Vec<u8> {
    let mut result = Vec::new();
    let mut value = *serialized_tricks;
    let mut current_trick = 0;
    while value > 0 {
        if value & 1 == 0 {
            current_trick += 1;
        } else {
            result.push(current_trick);
            current_trick = 0;
        }
        value >>= 1;
    }

    if current_trick > 0 {
        result.push(current_trick);
    }

    result.reverse();
    result
}

#[cfg(test)]
mod test {
    use std::convert::{TryInto};
    use deku::{DekuContainerRead, DekuContainerWrite};
    use crate::{AllTricks, calculate_needed_bits, deserialize_tricks, Game, JsGame, JsPlayer, JsRound, Player, serialize_tricks, Trump};
    use paste::paste;
    use crate::Trump::{Heart, Spade};
    use crate::values_playerscore::Value1;

    #[test]
    fn test_serialize_tricks() {
        let tricks = vec![0, 3, 2, 4, 0];
        let serialized = serialize_tricks(&tricks);
        assert_eq!(0b11000100100001, serialized);

        let original = deserialize_tricks(&serialized);
        assert_eq!(tricks, original);
    }

    #[test]
    fn test_8bit_tricks_serialize() {
        let tricks = vec![0, 0, 1, 2, 0];
        let serialized = serialize_tricks(&tricks);
        assert_eq!(0b11101001, serialized);

        let mut container = AllTricks::default();
        container.round_8 = serialized;
        let container_serialized = container.to_bytes().unwrap();
        let (_, container_deserialized) = AllTricks::from_bytes((&container_serialized, 0)).unwrap();

        let original = deserialize_tricks(&container_deserialized.round_8);
        assert_eq!(tricks, original);
    }

    #[test]
    fn test_8bit_tricks_deserialize() {
        let serialized = 0b11101001;
        let deserialized = deserialize_tricks(&serialized);
        assert_eq!(vec![0, 0, 1, 2, 0], deserialized);
    }


    #[test]
    fn test_variable_bit_array() {
        player_score!(TestStruct [1, 2]);
        let _bids = TestStruct::default();
    }

    #[test]
    fn serialize_enum() {
        for trump in vec![Trump::Spade, Trump::Heart, Trump::Club, Trump::Diamond, Trump::None] {
            let serialized: Vec<u8> = trump.try_into().unwrap();
            println!("{:?}, {:08b}", serialized, serialized[0]);
        }
    }

    #[test]
    fn test_serialize_round_scores() {
        let js_game = JsGame {
            game_version: 3,
            name: "Testgame".to_string(),
            players: vec![
                JsPlayer {
                    id: 0,
                    name: "Player 1".to_string()
                },
                JsPlayer {
                    id: 1,
                    name: "Player 2".to_string()
                },
            ],
            rounds: vec![ JsRound {
                n_cards: 10,
                trump: 1,
                bids: vec![2, 3],
                tricks: vec![4, 6],
                dealer_id: 0
            }]
        };

        let game = Game::from(js_game);
        assert_eq!(game.player_bids[0].round_1, Value1::MaxThree(2));
        assert_eq!(game.player_bids[1].round_1, Value1::MaxThree(3));
    }

    #[test]
    fn test_calculate_highest_bit() {
        assert_eq!(4, calculate_needed_bits(10))
    }
}