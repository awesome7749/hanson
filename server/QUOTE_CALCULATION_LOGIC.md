# HVAC Quote Calculation Logic

## Overview

The quote is calculated deterministically (no LLM) based on square footage, number of bedrooms, and whether the home has existing ductwork.

## Step 1: Determine System Type

- `hasDuctwork = "yes"` → **Ducted system** (Advantage Series: ODU + Air Handler)
- `hasDuctwork = "no"` or `"not sure"` → **Mini-split system** (BreezeIN Series: ODU + Wall Mount IDUs)

---

## Step 2A: Ducted System Calculation

### Tonnage

```
tonnage = squareFootage / 500
```

### Equipment Selection

Pick the smallest Advantage Series unit that meets or exceeds the calculated tonnage:

| ODU           | IDU (Air Handler) | BTU    | Tonnage | ODU Price  | IDU Price  |
|---------------|-------------------|--------|---------|------------|------------|
| H24TDH17XAC  | H24AHH17XAE      | 24,000 | 2.0     | $1,784.20  | $1,455.30  |
| H36TDH18XAC  | H36AHH18XAE      | 36,000 | 3.0     | $2,765.40  | $1,659.90  |
| H48TDH18XAC  | H48AHH18XAE      | 48,000 | 4.0     | $3,169.10  | $1,710.50  |
| H60TDH16XAC  | H60AHH16XAE      | 60,000 | 5.0     | $3,333.00  | $1,972.30  |

### Accessories (always included)

| Item              | Model        | Price    |
|-------------------|--------------|----------|
| Backup Heater 5kW | ATT05KEH    | $151.80  |
| Backup Heater 10kW| ATT10KEH    | $201.30  |
| Backup Heater 15kW| ATT15KEH    | $345.40  |
| Backup Heater 20kW| ATT20KEH    | $415.80  |
| Thermostat        | XK-120D2-100| $200.20  |

Backup heater sizing: match to system capacity (5kW for 2-ton, 10kW for 3-ton, 15kW for 4-ton, 20kW for 5-ton).

### Total Price (Ducted)

```
equipmentCost = ODU price + Air Handler price + Backup Heater price + Thermostat price
laborCost = $4,000 + $1,000 (electrical work per ODU)
totalCost = equipmentCost + laborCost
```

### MassSave Rebate (from AHRI certification)

| ODU + IDU Combo                    | AHRI        | Rebate     |
|------------------------------------|-------------|------------|
| H24TDH17XAC + H24AHH17XAE (2 ton)| 216706227   | $5,300.00  |
| H36TDH18XAC + H36AHH18XAE (3 ton)| 215869484   | $7,508.33  |
| H48TDH18XAC + H48AHH18XAE (4 ton)| 216046819   | $8,500.00  |
| H60TDH16XAC + H60AHH16XAE (5 ton)| 216046818   | $8,500.00  |

---

## Step 2B: Mini-Split System Calculation

### Step B1: Calculate bedroom BTU allocation (for sizing math only)

The 6K figure is used for calculation to avoid underestimating remaining house tonnage.
Actual installed IDU per bedroom is 9K (the smallest available unit).

```
if squareFootage < 3000:
    each bedroom = 6,000 BTU (0.5 ton)
else:
    one bedroom = 9,000 BTU (0.75 ton)
    remaining bedrooms = 6,000 BTU each (0.5 ton)
```

### Step B2: Calculate remaining house tonnage (common areas)

```
totalTonnage = squareFootage / 500
bedroomTonnage = sum of bedroom BTUs / 12,000
remainingTonnage = totalTonnage - bedroomTonnage
remainingBTU = remainingTonnage * 12,000
```

### Step B3: Select IDUs

- Each bedroom gets one **9K IDU** (regardless of 6K calculation value)
- Common area IDU(s) are selected to cover `remainingBTU`
- Available wall mount IDU sizes: 9K, 12K, 18K, 24K BTU
- Prefer fewer, larger IDUs for common areas

IDU prices (BreezeIN Wall Mount):

| Model         | BTU    | Price   |
|---------------|--------|---------|
| H09SBH23XPE  | 9,000  | $336.60 |
| H12SBH23XPE  | 12,000 | $393.90 |
| H18SBH22XPE  | 18,000 | $532.40 |
| H24SBH20XPE  | 24,000 | $666.60 |

### Step B4: Select ODU and validate combination

**1 zone** → Single-zone ODU matched to IDU size.

**2+ zones** → Multi-zone ODU. The IDU combination must exist in the valid combinations table.

If a combination is NOT valid: break the largest IDU into smaller units and move up to a larger ODU. Repeat until a valid combination is found.

Example: 9+9+9+24 is not valid for 36K ODU → break 24K into 12+12 → try 9+9+9+12+12 on 42K ODU → valid.

Single-zone ODU prices:

| Model         | BTU    | Price     |
|---------------|--------|-----------|
| H09SBH23XPC  | 9,000  | $858.00   |
| H12SBH23XPC  | 12,000 | $990.00   |
| H18SBH22XPC  | 18,000 | $1,261.70 |
| H24SBH20XPC  | 24,000 | $1,617.00 |

Multi-zone ODU prices:

| Model         | BTU    | Max Zones | Price     |
|---------------|--------|-----------|-----------|
| H18FMH22XPC  | 18,000 | 2         | $1,426.70 |
| H27FMH22XPC  | 27,000 | 3         | $2,009.70 |
| H36FMH21XPC  | 36,000 | 4         | $2,817.10 |
| H42FMH20XPC  | 42,000 | 5         | $3,097.60 |

### Valid Multi-Zone Combinations

**18K ODU (H18FMH22XPC) — up to 2 zones:**
- 1 unit: 9, 12
- 2 units: 9+9, 9+12, 12+12

**27K ODU (H27FMH22XPC) — up to 3 zones:**
- 2 units: 9+9, 9+12, 9+18, 12+12, 12+18, 18+18
- 3 units: 9+9+9, 9+9+12, 9+9+18, 9+12+12, 12+12+12

**36K ODU (H36FMH21XPC) — up to 4 zones:**
- 2 units: 9+18, 9+24, 12+12, 12+18, 12+24, 18+18, 18+24, 24+24
- 3 units: 9+9+9, 9+9+12, 9+9+18, 9+9+24, 9+12+12, 9+12+18, 9+12+24, 9+18+18, 12+12+12, 12+12+18, 12+12+24, 12+18+18
- 4 units: 9+9+9+9, 9+9+9+12, 9+9+9+18, 9+9+12+12, 9+9+12+18, 9+12+12+12, 12+12+12+12

**42K ODU (H42FMH20XPC) — up to 5 zones:**
- 2 units: 9+24, 12+24, 18+18, 18+24, 24+24
- 3 units: 9+9+18, 9+9+24, 9+12+12, 9+12+18, 9+12+24, 9+18+18, 9+18+24, 9+24+24, 12+12+12, 12+12+18, 12+12+24, 12+18+18, 12+18+24, 12+24+24, 18+18+18, 18+18+24
- 4 units: 9+9+9+9, 9+9+9+12, 9+9+9+18, 9+9+9+24, 9+9+12+12, 9+9+12+18, 9+9+12+24, 9+9+18+18, 9+9+18+24, 9+12+12+12, 9+12+12+18, 9+12+12+24, 9+12+18+18, 12+12+12+12, 12+12+12+18, 12+12+12+24, 12+12+18+18, 12+12+18+24
- 5 units: 9+9+9+9+9, 9+9+9+9+12, 9+9+9+9+18, 9+9+9+9+24, 9+9+9+12+12, 9+9+9+12+18, 9+9+9+12+24, 9+9+12+12+12, 9+9+12+12+18, 9+12+12+12+12, 12+12+12+12+12, 9+9+9+12+18

### Labor Cost (Mini-Split)

```
laborCost = (numberOfIDUs * $1,000) + (numberOfODUs * $1,000 electrical)
```

- $1,000 per IDU head (installation)
- $1,000 per ODU (electrical work)

### Total Price (Mini-Split)

```
equipmentCost = ODU price + sum of all IDU prices
laborCost = (numberOfIDUs * 1000) + (numberOfODUs * 1000)
totalCost = equipmentCost + laborCost
```

### MassSave Rebate

**Single-zone:**

| IDU + ODU Combo                      | AHRI        | Rebate     |
|--------------------------------------|-------------|------------|
| H09SBH23XPE + H09SBH23XPC (0.75 ton)| 215387259  | $1,987.50  |
| H12SBH23XPE + H12SBH23XPC (1 ton)   | 215387260  | $2,650.00  |
| H18SBH22XPE + H18SBH22XPC (1.5 ton) | 215387261  | $3,975.00  |
| H24SBH20XPE + H24SBH20XPC (1.92 ton)| 215387262  | $5,079.17  |

**Multi-zone (rebate is on the ODU):**

| ODU                  | AHRI        | Rebate     |
|----------------------|-------------|------------|
| H18FMH22XPC (1.5 ton) | 215387263 | $3,975.00  |
| H27FMH22XPC (2.25 ton)| 215387264 | $5,962.50  |
| H36FMH21XPC (2.92 ton)| 215387265 | $7,729.17  |
| H42FMH20XPC (3.5 ton) | 215387266 | $8,500.00  |

---

## Step 3: Final Quote

```
netCostAfterRebate = totalCost - massaveRebate
```

The rebate may exceed equipment cost — this is expected since it also offsets labor/installation.

---

## Input Data Sources

| Data Point       | Source                        | Fallback                    |
|------------------|-------------------------------|-----------------------------|
| Square footage   | RentCast API                  | User correction in form     |
| Bedrooms         | RentCast API                  | Ask user in questionnaire   |
| Has ductwork     | User questionnaire (Step 3)   | Default to mini-split       |

---

## Example A: 1,800 sq ft, 3 bedrooms, no ductwork (Mini-Split)

1. System type: Mini-split (no ductwork)
2. Bedroom BTU calc: 3 x 6,000 = 18,000 BTU = 1.5 tons (since < 3,000 sq ft)
3. Total tonnage: 1,800 / 500 = 3.6 tons
4. Remaining tonnage: 3.6 - 1.5 = 2.1 tons = 25,200 BTU
5. Common area IDU: 1x 24K BTU
6. All IDUs: 3x 9K (bedrooms) + 1x 24K (common) = 4 zones
7. Try 36K ODU → combo 9+9+9+24 is NOT in valid table
8. Break 24K into 12+12 → 5 zones: 9+9+9+12+12
9. Try 42K ODU → combo 9+9+9+12+12 is valid
10. Equipment: $3,097.60 (ODU) + 3x$336.60 + 2x$393.90 = $4,895.20
11. Labor: 5 heads x $1,000 + 1 ODU x $1,000 = $6,000
12. Total cost: $10,895.20
13. MassSave rebate: $8,500.00
14. **Net cost after rebate: $2,395.20**

## Example B: 2,000 sq ft, 3 bedrooms, has ductwork (Ducted)

1. System type: Ducted (has ductwork)
2. Tonnage: 2,000 / 500 = 4.0 tons
3. Equipment: H48TDH18XAC + H48AHH18XAE (48K BTU, 4 ton)
4. Backup heater: ATT15KEH (15kW) = $345.40
5. Thermostat: XK-120D2-100 = $200.20
6. Equipment: $3,169.10 + $1,710.50 + $345.40 + $200.20 = $5,425.20
7. Labor: $4,000 + $1,000 (electrical) = $5,000
8. Total cost: $10,425.20
9. MassSave rebate: $8,500.00
10. **Net cost after rebate: $1,925.20**
