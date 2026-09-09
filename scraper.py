import os
import json
import requests
from firecrawl import FirecrawlApp
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def scrape_url(url: str):
    """
    Scrape a URL using FireCrawl API.

    Args:
        url: The URL to scrape

    Returns:
        dict: The scraped data containing the webpage content
    """
    # Initialize FireCrawl with API key from environment
    api_key = os.getenv('FIRECRAWL_API_KEY')

    if not api_key:
        raise ValueError("FIRECRAWL_API_KEY not found in .env file")

    app = FirecrawlApp(api_key=api_key)

    print(f"Scraping {url}...")

    # Scrape the webpage
    result = app.scrape_url(url)

    return result

def download_csv(url: str, filename: str = "population_malaysia.csv"):
    """
    Download CSV file from URL and save to project folder.

    Args:
        url: The URL to download the CSV from
        filename: Output filename
    """
    output_path = os.path.join(os.path.dirname(__file__), filename)

    print(f"Downloading CSV from {url}...")

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        with open(output_path, 'wb') as f:
            f.write(response.content)

        # Get file size
        file_size = os.path.getsize(output_path)
        print(f"CSV downloaded successfully!")
        print(f"File: {output_path}")
        print(f"Size: {file_size:,} bytes")

        return output_path

    except requests.exceptions.RequestException as e:
        print(f"Error downloading CSV: {e}")
        return None

def save_results(data, filename: str = "scraped_data.json"):
    """
    Save scraped data to a JSON file.

    Args:
        data: The data to save (dict or Document object)
        filename: Output filename
    """
    output_path = os.path.join(os.path.dirname(__file__), filename)

    # Convert Document object to dict if necessary
    if hasattr(data, 'model_dump'):
        data_to_save = data.model_dump()
    elif hasattr(data, '__dict__'):
        data_to_save = data.__dict__
    else:
        data_to_save = data

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data_to_save, f, indent=2, ensure_ascii=False)

    print(f"Data saved to {output_path}")

if __name__ == "__main__":
    url = "https://open.dosm.gov.my/data-catalogue/population_malaysia"
    csv_url = "https://storage.dosm.gov.my/population/population_malaysia.csv"

    try:
        # Scrape the URL
        scraped_data = scrape_url(url)

        # Display results
        print("\n" + "="*50)
        print("Scraping Successful!")
        print("="*50)

        # Save scraped data to JSON file
        save_results(scraped_data)

        # Download CSV file
        print("\n" + "="*50)
        print("Downloading CSV File...")
        print("="*50)
        csv_path = download_csv(csv_url)

        if csv_path:
            print("\n" + "="*50)
            print("All tasks completed!")
            print("="*50)
            print(f"✓ Scraped data saved to: scraped_data.json")
            print(f"✓ CSV file saved to: {os.path.basename(csv_path)}")
        else:
            print("\nCSV download failed, but scraping data was saved.")

    except ValueError as e:
        print(f"Error: {e}")
        print("Please ensure .env file exists with FIRECRAWL_API_KEY set")
    except Exception as e:
        print(f"Error: {e}")
