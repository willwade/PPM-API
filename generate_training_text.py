import requests
import os
import random
import re
from datasets import load_dataset

def fetch_alice_text(url):
    """
    Fetches and cleans the text of Alice in Wonderland from the given URL.
    """
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch Alice in Wonderland text. Status code: {response.status_code}")

    text = response.text

    # Remove everything after "End of the Project Gutenberg EBook of Alice in Wonderland, by Lewis Carroll"
    cutoff_phrase = "End of the Project Gutenberg EBook of Alice in Wonderland, by Lewis Carroll"
    if cutoff_phrase in text:
        text = text.split(cutoff_phrase, 1)[0]

    # Remove square bracket content (e.g., [Illustration])
    text = re.sub(r"\[.*?\]", "", text)

    # Remove blank lines
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    # Remove headings (lines that are all uppercase or start with Roman numerals)
    roman_numerals = re.compile(r"^(?:[IVXLCDM]+(?:--|[ ]))?.*?[A-Z][A-Z]+.*$")
    lines = [line for line in lines if not roman_numerals.match(line)]

    # Combine fragmented lines into full sentences
    combined_lines = []
    temp_line = ""
    for line in lines:
        if line.endswith((".", "!", "?")):  # If the line ends with punctuation, it's complete
            temp_line += (" " + line).strip()  # Add current line to temp_line
            combined_lines.append(temp_line)  # Add the complete sentence to combined_lines
            temp_line = ""  # Reset temp_line
        else:
            temp_line += (" " + line).strip()  # Continue the sentence
    if temp_line:  # Add any remaining sentence
        combined_lines.append(temp_line)

    return "\n".join(combined_lines)

def generate_training_text(output_file="training_text.txt", max_lines=1000):
    """
    Generate training text by combining data from Alice in Wonderland,
    AAC-like phrases, and a subset of Gutenberg-dialog-en dataset.

    Args:
        output_file (str): Path to save the generated training text.
        max_lines (int): Maximum number of lines to include in the output file.
    """
    # Fetch and clean Alice in Wonderland text from GitHub raw content
    alice_url = "https://raw.githubusercontent.com/GITenberg/Alice-s-Adventures-in-Wonderland_19033/master/19033.txt"
    alice_text = fetch_alice_text(alice_url)
    alice_lines = alice_text.split("\n")

    # Load AAC-like phrases dataset
    aac_data = load_dataset("willwade/UNL-AAC-Phrases", split="train")
    aac_sentences = [row["Sentence"] for row in aac_data]  # Use the correct case

    # Load Gutenberg-dialog-en dataset
    gutenberg_dialog_data = load_dataset("willwade/Gutenberg-dialog-en", split="train")
    gutenberg_dialog_lines = [line.strip() for line in gutenberg_dialog_data["text"]]

    # Filter AAC-like text from Gutenberg-dialog-en
    def is_aac_like(text):
        return len(text.split()) <= 10

    filtered_gutenberg_dialog = [line for line in gutenberg_dialog_lines if is_aac_like(line)]

    # Combine data
    training_lines = []

    # Add Alice in Wonderland sentences
    training_lines.extend(random.sample(alice_lines, min(len(alice_lines), max_lines // 3)))

    # Add AAC-like phrases
    training_lines.extend(random.sample(aac_sentences, min(len(aac_sentences), max_lines // 3)))

    # Add filtered Gutenberg-dialog-en sentences
    training_lines.extend(random.sample(filtered_gutenberg_dialog, min(len(filtered_gutenberg_dialog), max_lines // 3)))

    # Shuffle and limit the number of lines
    # Shuffle and ensure lines are full sentences
    training_lines = [line for line in training_lines if len(line.split()) > 2]
    random.shuffle(training_lines)
    training_lines = training_lines[:max_lines]

    # Ensure directory exists only if the output file includes a directory
    output_dir = os.path.dirname(output_file)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    # Save to file
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(training_lines))

    print(f"Training text saved to {output_file}")

# Run the script
if __name__ == "__main__":
    generate_training_text()