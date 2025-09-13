#!/usr/bin/env python3
"""
Script to convert knihy.csv to a JavaScript file with book data.
This allows the website to work without a server and resolves CORS issues.
"""

import csv
import json
import os


def csv_to_js(csv_file="knihy.csv", js_file="books-data.js"):
    """Convert CSV file to JavaScript array and save it."""
    books = []

    try:
        with open(csv_file, "r", encoding="utf-8") as file:
            # Read CSV with proper handling of quoted fields
            csv_reader = csv.DictReader(file)

            for row in csv_reader:
                # Clean up the data and ensure all required fields exist
                description = row.get("description", "").strip()
                # Unescape newlines for proper JavaScript handling
                description = description.replace("\\n", "\n").replace("\\r", "\r")

                book = {
                    "country": row.get("country", "").strip(),
                    "genre": row.get("genre", "").strip(),
                    "topic": row.get("topic", "").strip(),
                    "author": row.get("author", "").strip(),
                    "name": row.get("name", "").strip(),
                    "description": description,
                    "year": row.get("year", "").strip(),
                }

                # Only add books that have essential data
                if book["author"] and book["name"] and book["country"]:
                    books.append(book)

        # Generate JavaScript content
        js_content = f"""// Auto-generated file - do not edit manually
// Generated from {csv_file} using csv_to_js.py
// Total books: {len(books)}

const BOOKS_DATA = {json.dumps(books, ensure_ascii=False, indent=2)};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {{
    module.exports = BOOKS_DATA;
}}
"""

        # Write to JavaScript file
        with open(js_file, "w", encoding="utf-8") as file:
            file.write(js_content)

        print(
            f"✅ Successfully converted {len(books)} books from {csv_file} to {js_file}"
        )
        return len(books)

    except FileNotFoundError:
        print(f"❌ Error: {csv_file} not found")
        return 0
    except Exception as e:
        print(f"❌ Error converting CSV to JS: {e}")
        return 0


if __name__ == "__main__":
    # Run the conversion
    book_count = csv_to_js()

    if book_count > 0:
        print(
            f"📚 Conversion complete! {book_count} books are now available in books-data.js"
        )
        print("🔧 Don't forget to update your HTML to include the new script file")
    else:
        print("💥 Conversion failed!")
