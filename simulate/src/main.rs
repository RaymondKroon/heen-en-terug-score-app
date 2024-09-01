use simulate::simulation::{format_probabilities, simulate};

fn main() {
    let result = simulate("(3s) 5p c 2c 3c".to_string());
    println!("{}", format_probabilities(&result.unwrap()));
}

