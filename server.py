"""
CrowdSense Alerts Backend
Flask server for real-time crowd density data using populartimes library
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from populartimes import get_populartimes
from populartimes.crawler import check_response_code, DETAIL_URL
import requests
import time
import os
import json

app = Flask(__name__)
CORS(app)

# Google Maps API key - kept server-side only
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', 'AIzaSyDvkuGcBKgpRfLldEc603tUDSiceFA3azQ')


def search_place_by_name(api_key, place_name):
    """
    Search for a place using Google Places API Text Search and return place_id.
    """
    url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={requests.utils.quote(place_name)}&key={api_key}"
    resp = requests.get(url, timeout=30)
    data = resp.json()

    if data.get('status') != 'OK' or not data.get('results'):
        return None

    return data['results'][0]['place_id']


def get_populartimes_data(api_key, place_name):
    """
    Get populartimes data for a place by name.
    First searches Google Places to get the place_id, then fetches populartimes.
    """
    # Step 1: Search for the place
    place_id = search_place_by_name(api_key, place_name)
    if not place_id:
        return None

    # Step 2: Get populartimes using the place_id
    result = get_populartimes(api_key, place_id)
    return result


def transform_populartimes_data(data):
    """
    Transform populartimes response into our simplified format.
    """
    if not data:
        return None

    # Extract current popularity (live data from Google)
    current_popularity = data.get('current_popularity', None)

    # Extract wait time
    current_wait_time = data.get('time_wait', None)

    # Transform populartimes to our format (7 days)
    populartimes_transformed = []
    raw_populartimes = data.get('populartimes', [])

    for day_data in raw_populartimes:
        day_name = day_data.get('name', 'Unknown')
        hourly_data = day_data.get('data', [])

        populartimes_transformed.append({
            "name": day_name,
            "data": hourly_data
        })

    return {
        "name": data.get('name', 'Unknown'),
        "current_popularity": current_popularity,
        "populartimes": populartimes_transformed,
        "current_wait_time": current_wait_time
    }


@app.route('/crowd', methods=['GET'])
def get_crowd_data():
    """
    GET /crowd?place=<place_name>

    Returns crowd density data for a given place.
    Uses Google Places API via populartimes library.
    """
    place_name = request.args.get('place')

    if not place_name:
        return jsonify({"error": "Missing 'place' parameter"}), 400

    print(f"[CrowdSense] Searching for: {place_name}")

    try:
        start_time = time.time()

        # Fetch data from Google Places API via populartimes
        result = get_populartimes_data(GOOGLE_API_KEY, place_name)

        elapsed = time.time() - start_time
        print(f"[CrowdSense] API response time: {elapsed:.2f}s")

        if not result:
            print(f"[CrowdSense] No results found for: {place_name}")
            return jsonify({
                "error": "Place not found",
                "message": f"No data found for '{place_name}'. Try a more specific location name."
            }), 404

        print(f"[CrowdSense] Found: {result.get('name', 'Unknown')}")
        print(f"[CrowdSense] current_popularity: {result.get('current_popularity')}")
        print(f"[CrowdSense] populartimes days: {len(result.get('populartimes', []))}")

        # Transform to our simplified format
        transformed = transform_populartimes_data(result)

        if transformed:
            print(f"[CrowdSense] Returning: {transformed['name']}")
            return jsonify(transformed)
        else:
            print(f"[CrowdSense] Failed to transform data")
            return jsonify({"error": "Failed to process place data"}), 500

    except Exception as e:
        error_type = type(e).__name__
        print(f"[CrowdSense] Error: {error_type}: {e}")
        return jsonify({
            "error": error_type,
            "message": str(e)
        }), 500


@app.route('/test', methods=['GET'])
def test_endpoint():
    """Test endpoint to verify server is working."""
    return jsonify({
        "status": "ok",
        "message": "CrowdSense server is running",
        "api_key": GOOGLE_API_KEY[:10] + "..." if GOOGLE_API_KEY else "NOT SET"
    })


if __name__ == '__main__':
    print("=" * 50)
    print("CrowdSense Alerts Backend")
    print("=" * 50)
    print("API Key configured: True")
    print("Endpoints:")
    print("  GET /crowd?place=<place_name> - Get crowd data")
    print("  GET /test - Test endpoint")
    print("Running on http://localhost:5000")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)
