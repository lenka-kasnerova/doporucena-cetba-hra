import csv
import os
import sys
import time
from urllib.parse import quote_plus, urljoin

import requests
from bs4 import BeautifulSoup

INPUT_CSV = "knihy.csv"
OUTPUT_CSV = "knihy_s_popisem.csv"
COVERS_DIR = "covers"
DEBUG_DIR = "debug"
BASE_URL = "https://www.databazeknih.cz/"


def get_book_details(book_name, author, debug=False, year_only=False):
    """
    Searches for a book on databazeknih.cz and scrapes its details.

    Args:
        book_name (str): The name of the book to search for.
        author (str): The author of the book.
        debug (bool): If True, saves the search results page for debugging.
        year_only (bool): If True, only scrapes the year and skips the detail page.

    Returns:
        tuple: A tuple containing the description (str), image URL (str), and year (str),
               or (None, None, None) if not found.
    """
    try:
        # 1. Search for the book
        search_query = f"{book_name} {author}".strip()
        search_url = f"{BASE_URL}search?q={quote_plus(search_query)}"
        print(f"Searching for '{search_query}'...")

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        response = requests.get(search_url, headers=headers)

        if debug:
            if not os.path.exists(DEBUG_DIR):
                os.makedirs(DEBUG_DIR)
            safe_query = "".join(
                c for c in search_query if c.isalnum() or c in (" ", ".")
            )
            debug_filepath = os.path.join(DEBUG_DIR, f"search_{safe_query}.html")
            with open(debug_filepath, "w", encoding="utf-8") as f:
                f.write(response.text)
            print(f"  -> Saved debug HTML to '{debug_filepath}'")

        response.raise_for_status()
        time.sleep(1.5)  # Delay to be respectful to the server

        soup = BeautifulSoup(response.text, "html.parser")

        # 2. Find the first search result link and year
        # The link to the book has class 'new' and type 'book'
        detail_link = soup.find("a", {"class": "new", "type": "book", "href": True})
        if not detail_link:
            print(f"  -> No search results found for '{book_name}'.")
            return None, None, None

        # Find the year from the search result item
        year = None
        result_container = detail_link.find_parent("p", class_="new")
        if result_container:
            pozn_span = result_container.find("span", class_="pozn")
            if pozn_span:
                # Text is like "2007, Iva Procházková"
                year_text = pozn_span.get_text(strip=True).split(",")[0]
                if year_text.isdigit():
                    year = year_text
                    print(f"  -> Found year: {year}")

        if year_only:
            return None, None, year

        detail_url = urljoin(BASE_URL, detail_link["href"])

        # 3. Go to the detail page
        print(f"  -> Found detail page: {detail_url}")
        response = requests.get(detail_url, headers=headers)

        if debug:
            safe_book_name = "".join(
                c for c in book_name if c.isalnum() or c in (" ", ".")
            )
            debug_filepath = os.path.join(DEBUG_DIR, f"detail_{safe_book_name}.html")
            with open(debug_filepath, "w", encoding="utf-8") as f:
                f.write(response.text)
            print(f"  -> Saved detail page HTML to '{debug_filepath}'")

        response.raise_for_status()
        time.sleep(1)  # Another delay

        detail_soup = BeautifulSoup(response.text, "html.parser")

        # 4. Scrape description and cover image URL
        # The description is in a <p> tag with class 'new2 odtop'
        description_tag = detail_soup.find("p", class_="new2 odtop")
        if description_tag:
            description = description_tag.get_text(" ", strip=True)
            # Remove the "more" text at the end of the description
            description = description.removesuffix(" ... celý text").strip()
        else:
            description = "Popis nenalezen."

        # The cover image is an <img> with class 'kniha_img coverOnDetail'
        cover_img_tag = detail_soup.find("img", class_="kniha_img coverOnDetail")
        cover_url = urljoin(BASE_URL, cover_img_tag["src"]) if cover_img_tag else None

        print(f"  -> Description and cover URL found.")
        return description, cover_url, year

    except requests.exceptions.RequestException as e:
        print(f"  -> An error occurred: {e}")
        return None, None, None


def download_cover(url, author, book_name):
    """
    Downloads a book cover image and saves it to the covers directory.
    """
    if not url:
        print(f"  -> No cover URL for '{book_name}'. Skipping download.")
        return

    try:
        # Sanitize filename
        safe_author = "".join(c for c in author if c.isalnum() or c in (" ", "."))
        safe_book_name = "".join(c for c in book_name if c.isalnum() or c in (" ", "."))
        filename = f"{safe_author} - {safe_book_name}.jpg".strip()
        filepath = os.path.join(COVERS_DIR, filename)

        print(f"  -> Downloading cover to '{filepath}'")
        response = requests.get(url, stream=True)
        response.raise_for_status()

        with open(filepath, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        time.sleep(1)  # Delay after download

    except requests.exceptions.RequestException as e:
        print(f"  -> Failed to download cover for '{book_name}': {e}")
    except IOError as e:
        print(f"  -> Failed to save cover for '{book_name}': {e}")


def main():
    """
    Main function to read CSV, scrape data, and write a new CSV.
    """
    debug_mode = "--debug" in sys.argv
    year_only_mode = "--year-only" in sys.argv

    # Create covers directory if it doesn't exist
    if not os.path.exists(COVERS_DIR) and not year_only_mode:
        os.makedirs(COVERS_DIR)
        print(f"Created directory: '{COVERS_DIR}'")

    try:
        with open(INPUT_CSV, mode="r", encoding="utf-8") as infile:
            reader = csv.DictReader(infile)
            # Add 'year' and 'description' to fieldnames if they don't exist
            original_fieldnames = reader.fieldnames
            fieldnames = original_fieldnames[:]
            if "year" not in fieldnames:
                fieldnames.append("year")
            if "description" not in fieldnames:
                fieldnames.append("description")
            all_rows = list(reader)

        with open(OUTPUT_CSV, mode="w", encoding="utf-8", newline="") as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()

            for row in all_rows:
                book_name = row.get("name", "").strip()
                author = row.get("author", "").strip()

                if not book_name:
                    print("Skipping row with empty book name.")
                    row["description"] = "Chybí název knihy."
                    row["year"] = ""
                    writer.writerow(row)
                    continue

                description, cover_url, year = get_book_details(
                    book_name, author, debug=debug_mode, year_only=year_only_mode
                )

                row["year"] = year if year else ""
                if not year_only_mode:
                    row["description"] = (
                        description if description else "Nezdařilo se načíst popis."
                    )
                    download_cover(cover_url, author, book_name)
                elif "description" not in row:
                    # If year-only mode and description column is new, fill it
                    row["description"] = ""

                writer.writerow(row)
                print("-" * 20)

        print(f"\nProcessing complete. New file created: '{OUTPUT_CSV}'")
        if not year_only_mode:
            print(f"Book covers are saved in the '{COVERS_DIR}' folder.")

    except FileNotFoundError:
        print(f"Error: The file '{INPUT_CSV}' was not found.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    main()
