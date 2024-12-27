from datasets import load_dataset
import random

def generate_training_text(output_file="training_text.txt", max_lines=1000):
    """
    Generate training text by combining filtered data from Alice in Wonderland,
    AAC-like phrases, and a subset of Gutenberg-dialog-en dataset.
    
    Args:
        output_file (str): Path to save the generated training text.
        max_lines (int): Maximum number of lines to include in the output file.
    """
    # Load datasets
    alice_data = load_dataset("gutenberg", split="train", data_files={"train": ["https://www.gutenberg.org/files/11/11-0.txt"]})
    aac_data = load_dataset("willwade/UNL-AAC-Phrases", split="train")
    gutenberg_dialog_data = load_dataset("willwade/Gutenberg-dialog-en", split="train")
    
    # Filter AAC-like text from Gutenberg-dialog-en
    def is_aac_like(dialog):
        return any(len(sent.split()) <= 10 for sent in dialog["text"].split("\n"))
    
    filtered_gutenberg_dialog = gutenberg_dialog_data.filter(is_aac_like)

    # Combine data
    training_lines = []

    # Add Alice in Wonderland sentences
    training_lines.extend(random.sample(alice_data["text"], min(len(alice_data["text"]), max_lines // 3)))

    # Add AAC-like phrases
    training_lines.extend(random.sample(aac_data["text"], min(len(aac_data["text"]), max_lines // 3)))

    # Add filtered Gutenberg-dialog-en sentences
    training_lines.extend(random.sample(filtered_gutenberg_dialog["text"], min(len(filtered_gutenberg_dialog["text"]), max_lines // 3)))

    # Shuffle and limit the number of lines
    random.shuffle(training_lines)
    training_lines = training_lines[:max_lines]

    # Save to file
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(training_lines))

    print(f"Training text saved to {output_file}")

# Run the script
if __name__ == "__main__":
    generate_training_text()
