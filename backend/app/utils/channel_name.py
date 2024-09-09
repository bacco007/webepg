
import re

from app.constants.channel_data import CHANNEL_GROUPS, CLEANUP_LIST


def clean_channel_name(channel_name: str) -> str:
    """
    Clean up the channel name by removing specific location-based terms.

    Args:
    channel_name (str): The original channel name.
    cleanup_list (List[str]): List of terms to remove from the channel name.

    Returns:
    str: The cleaned channel name.
    """
    cleaned_name = channel_name
    cleanup_list = CLEANUP_LIST

    # Add "Channel" to the cleanup list if it's not already there
    if "Channel" not in cleanup_list:
        cleanup_list = cleanup_list + ["Channel"]

    for term in cleanup_list:
        # Use word boundaries to ensure we're removing whole words
        pattern = r"\s*\b" + re.escape(term) + r"\b\s*"
        cleaned_name = re.sub(pattern, " ", cleaned_name, flags=re.IGNORECASE)

    if "Nine" in cleaned_name:
        cleaned_name = cleaned_name.replace("Nine", "9")

    if "Seven" in cleaned_name:
        cleaned_name = cleaned_name.replace("Seven", "7")

    if cleaned_name.strip() == "NBN":
        return "9"

    if "NBN" in cleaned_name:
        cleaned_name = cleaned_name.replace("NBN", "").strip()

    if cleaned_name.strip() == "Imparja Television /":
        return "Imparja"

    if "Imparja " in cleaned_name:
        cleaned_name = cleaned_name.replace("Imparja ", "9").strip()

    return cleaned_name.strip().replace(" ,", "")


def get_channel_group(channel_name: str) -> str:
    """
    Get the channel group for a given channel name.

    Args:
    channel_name (str): The channel name.

    Returns:
    str: The channel group, or 'Unknown' if not found.
    """
    channel_groups = CHANNEL_GROUPS

    for group, channels in channel_groups.items():
        if channel_name in channels:
            return group

    return "Unknown"
