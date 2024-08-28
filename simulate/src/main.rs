use simulate::simulation::{simulate};

fn main() {
    let result = simulate("(5s) 5p x 2c 5h".to_string());
    println!("{}", result);
}

