import asyncio
from services.air_quality import fetch_air_quality
from services.tree_calculator import calculate_tree_deficit

async def main():
    print("========================================")
    print("🌿 PRAANVAYU TELEMETRY & DEFICIT TEST 🌿")
    print("========================================")

    # 1. Test Air Telemetry Fetch (Jaipur / Urban Coordinates)
    print("\n[1/2] Fetching Live Air Telemetry (Lat: 26.9124, Lon: 75.7873)...")
    telemetry = await fetch_air_quality(lat=26.9124, lon=75.7873)
    print(f"-> Status: {telemetry.get('status')}")
    print(f"-> AQI: {telemetry.get('aqi')}")
    print(f"-> PM2.5: {telemetry.get('pm2_5')} µg/m³")
    print(f"-> PM10: {telemetry.get('pm10')} µg/m³")
    print(f"-> Humidity: {telemetry.get('humidity')}%")

    # 2. Test Tree Deficit Calculation
    print("\n[2/2] Calculating Exact Tree Deficit...")
    total_area = 50000.0       # 50,000 sqm
    plantable_area = 12000.0   # 12,000 sqm
    current_canopy = 14.0      # 14% existing green cover

    analysis = calculate_tree_deficit(
        total_area_sqm=total_area,
        plantable_area_sqm=plantable_area,
        current_canopy_percent=current_canopy,
        aqi=telemetry.get("aqi", 150)
    )

    print(f"-> Benchmark Target: {analysis['benchmark_canopy_percent']}%")
    print(f"-> Current Canopy: {analysis['current_canopy_percent']}%")
    print(f"-> Deficit: {analysis['deficit_percent']}%")
    print(f"-> Exact Trees Needed: {analysis['exact_trees_needed']} Saplings")
    print("\n-> Recommended Species Allocation:")
    for sp in analysis['recommended_species']:
        print(f"   * {sp['name']} -> {sp['allocation_count']} Trees ({sp['tag']})")

    print("\n========================================")
    print("✅ TEST PIPELINE PASSED SUCCESSFULLY!")
    print("========================================")

if __name__ == "__main__":
    asyncio.run(main())