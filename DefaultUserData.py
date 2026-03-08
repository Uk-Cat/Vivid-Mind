import json

def initialize_user_progress(input_file, output_file):
    try:
        # 1. Load your existing card data
        with open(input_file, 'r', encoding='utf-8') as f:
            cards = json.load(f)

        # 2. Extract the 'Front' of each card and set value to "0"
        # We use a dictionary comprehension to build the new structure
        user_data = {card['Front']: "0" for card in cards if 'Front' in card}

        # 3. Save the new per-user progress file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(user_data, f, ensure_ascii=False, indent=4)
        
        print(f"Success! {len(user_data)} words mapped to '0' in {output_file}")

    except FileNotFoundError:
        print(f"Error: Could not find {input_file}")
    except json.JSONDecodeError:
        print(f"Error: {input_file} is not a valid JSON file")

# Run the script
if __name__ == "__main__":
    initialize_user_progress('Card.json', 'UserProgress.json')