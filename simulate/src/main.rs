use simulate::simulation::{format_probabilities, simulate};

fn main() {
    let result = simulate("(3s) 5p x 2c 3c 5c".to_string());
    println!("{}", format_probabilities(&result.unwrap()));
}

