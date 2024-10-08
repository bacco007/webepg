import json
import os
from typing import Set


def extract_channel_names(directory: str) -> Set[str]:
    """
    Extract unique channel names from JSON files in the given directory.

    Args:
    directory (str): The directory to search for JSON files.

    Returns:
    Set[str]: A set of unique channel names.
    """
    channel_names = set()

    for filename in os.listdir(directory):
        if filename.startswith("xmltvnet") and filename.endswith("channels.json"):
            file_path = os.path.join(directory, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as file:
                    data = json.load(file)
                    for item in data:
                        channel_name = item.get("channel_name")
                        if channel_name:
                            channel_names.add(channel_name)
            except json.JSONDecodeError:
                print(f"Error decoding JSON in file: {filename}")
            except IOError:
                print(f"Error reading file: {filename}")

    return channel_names


def write_channel_names_to_file(channel_names: Set[str], output_file: str) -> None:
    """
    Write the unique channel names to a text file.

    Args:
    channel_names (Set[str]): Set of unique channel names.
    output_file (str): Name of the output file.
    """
    try:
        with open(output_file, "w", encoding="utf-8") as file:
            for name in sorted(channel_names):
                file.write(f"{name}\n")
        print(f"Channel names written to {output_file}")
    except IOError:
        print(f"Error writing to file: {output_file}")


def main():
    directory = input("Enter the directory path to search: ")
    output_file = "channel_names.txt"

    if not os.path.isdir(directory):
        print("Invalid directory path.")
        return

    channel_names = extract_channel_names(directory)
    write_channel_names_to_file(channel_names, output_file)
    print(f"Found {len(channel_names)} unique channel names.")


if __name__ == "__main__":
    main()
