use futures::executor::block_on;

use simulate::simulation::{format_probabilities, simulate};

fn main() {
    block_on(async {
        match simulate("5p c 2c 3c".to_string()).await {
            Ok(result) => println!("{}", format_probabilities(&result)),
            Err(e) => eprintln!("Error: {}", e),
        }
    });

}
