use simulate::simulation::{simulate};

fn main() {
    let result = simulate("(5s) 4p c 2c 3c".to_string());
    println!("{}", result);
}

