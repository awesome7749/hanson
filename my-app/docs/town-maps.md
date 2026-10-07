# Town map coordinates

`src/revamp/townMapBounds.json` contains a bounding box and an interior point
for each town page. The values come from the U.S. Census Bureau's 2025
Massachusetts county-subdivision geography:

- [TIGER/Line boundary shapefile](https://www2.census.gov/geo/tiger/TIGER2025/COUSUB/tl_2025_25_cousub.zip)
- [Gazetteer county subdivisions](https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_gaz_cousubs_25.txt)

The stored bounds have 10% padding on each side. `townMapSrc()` uses them to
center the OpenStreetMap embed and marks the Census interior point. These
markers identify towns, not customer installation addresses. Google Maps links
open the corresponding town in a new tab.
