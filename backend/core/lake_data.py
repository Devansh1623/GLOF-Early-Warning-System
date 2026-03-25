"""
Real glacial lake data from CWC/NRSC Glacial Lake Atlas (2022-23)
and verified GLOF events from NDMA, CWC, and PIB reports.
"""

LAKES = [
    {
        "id": "GL001",
        "name": "South Lhonak Lake",
        "state": "Sikkim",
        "lat": 27.9167,
        "lon": 88.2000,
        "elevation_m": 5200,
        "area_ha": 120.5,
        "dam_type": "Moraine",
        "river_basin": "Teesta",
        "cwc_monitoring": True,
        "current_risk_level": "Critical",
        "current_risk_score": 0,
        "notes": "Burst on Oct 4, 2023 causing Teesta-III dam collapse. Active CWC EWS installed."
    },
    {
        "id": "GL002",
        "name": "Samudra Tapu Lake",
        "state": "Himachal Pradesh",
        "lat": 32.4500,
        "lon": 77.3833,
        "elevation_m": 4950,
        "area_ha": 95.3,
        "dam_type": "Moraine",
        "river_basin": "Chenab",
        "cwc_monitoring": True,
        "current_risk_level": "Critical",
        "current_risk_score": 0,
        "notes": "Rapidly expanding since 2000. CWC identified as highest priority for mitigation."
    },
    {
        "id": "GL003",
        "name": "Gepang Gath Lake",
        "state": "Himachal Pradesh",
        "lat": 32.5500,
        "lon": 77.1000,
        "elevation_m": 4720,
        "area_ha": 62.1,
        "dam_type": "Moraine",
        "river_basin": "Chenab",
        "cwc_monitoring": True,
        "current_risk_level": "High",
        "current_risk_score": 0,
        "notes": "Partial breach event in Jul 2022. Dam reinforcement ongoing."
    },
    {
        "id": "GL004",
        "name": "Rathong Glacier Lake",
        "state": "Sikkim",
        "lat": 27.3000,
        "lon": 88.1667,
        "elevation_m": 4680,
        "area_ha": 15.2,
        "dam_type": "Ice-cored moraine",
        "river_basin": "Teesta",
        "cwc_monitoring": True,
        "current_risk_level": "High",
        "current_risk_score": 0,
        "notes": "Dead-ice core susceptible to melt-induced piping failure."
    },
    {
        "id": "GL005",
        "name": "Kedarnath Glacial Lake",
        "state": "Uttarakhand",
        "lat": 30.7352,
        "lon": 79.0669,
        "elevation_m": 4580,
        "area_ha": 8.7,
        "dam_type": "Moraine",
        "river_basin": "Mandakini",
        "cwc_monitoring": True,
        "current_risk_level": "High",
        "current_risk_score": 0,
        "notes": "Site of 2013 GLOF disaster. New lake forming upstream."
    },
    {
        "id": "GL006",
        "name": "Gangabal Lake",
        "state": "Jammu & Kashmir",
        "lat": 34.4167,
        "lon": 74.9833,
        "elevation_m": 3570,
        "area_ha": 230.0,
        "dam_type": "Bedrock + Moraine",
        "river_basin": "Jhelum",
        "cwc_monitoring": False,
        "current_risk_level": "Moderate",
        "current_risk_score": 0,
        "notes": "Large stable lake. Low immediate risk but susceptible to seismic triggers."
    },
    {
        "id": "GL007",
        "name": "Satopanth Tal",
        "state": "Uttarakhand",
        "lat": 30.7667,
        "lon": 79.3167,
        "elevation_m": 4600,
        "area_ha": 18.4,
        "dam_type": "Moraine",
        "river_basin": "Alaknanda",
        "cwc_monitoring": False,
        "current_risk_level": "Moderate",
        "current_risk_score": 0,
        "notes": "Proglacial lake showing expansion. In NRSC monitoring list."
    },
    {
        "id": "GL008",
        "name": "Sheshnag Lake",
        "state": "Jammu & Kashmir",
        "lat": 34.0333,
        "lon": 75.4667,
        "elevation_m": 3590,
        "area_ha": 17.0,
        "dam_type": "Bedrock",
        "river_basin": "Lidder",
        "cwc_monitoring": False,
        "current_risk_level": "Low",
        "current_risk_score": 0,
        "notes": "Bedrock-dammed, low priority. Monitored for tourism safety."
    },
    {
        "id": "GL009",
        "name": "Tsomgo Lake",
        "state": "Sikkim",
        "lat": 27.3722,
        "lon": 88.7581,
        "elevation_m": 3753,
        "area_ha": 24.5,
        "dam_type": "Moraine + Landslide",
        "river_basin": "Teesta",
        "cwc_monitoring": False,
        "current_risk_level": "Moderate",
        "current_risk_score": 0,
        "notes": "Tourist destination. Seasonal water level fluctuations monitored."
    },
    {
        "id": "GL010",
        "name": "Parechu Lake",
        "state": "Himachal Pradesh",
        "lat": 32.7167,
        "lon": 78.5000,
        "elevation_m": 4340,
        "area_ha": 52.8,
        "dam_type": "Landslide",
        "river_basin": "Spiti",
        "cwc_monitoring": True,
        "current_risk_level": "Moderate",
        "current_risk_score": 0,
        "notes": "Landslide-dammed in 2004. Controlled drainage channel in place since 2005."
    },
    {
        "id": "GL011",
        "name": "Gurudongmar Lake",
        "state": "Sikkim",
        "lat": 28.0244,
        "lon": 88.7128,
        "elevation_m": 5148,
        "area_ha": 45.0,
        "dam_type": "Moraine + Bedrock",
        "river_basin": "Teesta",
        "cwc_monitoring": False,
        "current_risk_level": "Low",
        "current_risk_score": 0,
        "notes": "One of the highest lakes in India. Seasonal freeze-thaw cycle observed."
    },
    {
        "id": "GL012",
        "name": "Suraj Tal",
        "state": "Himachal Pradesh",
        "lat": 32.7667,
        "lon": 77.2000,
        "elevation_m": 4890,
        "area_ha": 13.0,
        "dam_type": "Moraine",
        "river_basin": "Bhaga",
        "cwc_monitoring": False,
        "current_risk_level": "Low",
        "current_risk_score": 0,
        "notes": "Near Baralacha La pass. Small but expanding proglacial lake."
    },
]


GLOF_EVENTS = [
    {
        "event_id": "EVT001",
        "title": "South Lhonak Lake GLOF",
        "location": "Sikkim, India",
        "state": "Sikkim",
        "date": "2023-10-04",
        "severity": "Critical",
        "impact_summary": "Massive outburst flood destroyed Teesta-III hydroelectric dam (510 MW). "
                          "42 lives lost, 100+ missing. Peak discharge estimated at 4,800 m³/s. "
                          "Downstream areas in Mangan district devastated. CWC EWS equipment damaged.",
        "peak_discharge_m3s": 4800,
        "source": "CWC / PIB / NDMA"
    },
    {
        "event_id": "EVT002",
        "title": "Chamoli Disaster (Rishiganga GLOF)",
        "location": "Uttarakhand, India",
        "state": "Uttarakhand",
        "date": "2021-02-07",
        "severity": "Critical",
        "impact_summary": "Rock-ice avalanche from Ronti Peak triggered a massive debris flow. "
                          "Destroyed Rishiganga (13.2 MW) and Tapovan Vishnugad (520 MW) projects. "
                          "204 fatalities. Peak discharge estimated at 16,000 m³/s.",
        "peak_discharge_m3s": 16000,
        "source": "NDMA / GSI / NRSC"
    },
    {
        "event_id": "EVT003",
        "title": "Kedarnath Flood",
        "location": "Uttarakhand, India",
        "state": "Uttarakhand",
        "date": "2013-06-17",
        "severity": "Critical",
        "impact_summary": "Chorabari glacial lake burst combined with extreme rainfall (340 mm in 24 hrs). "
                          "Entire Kedarnath town destroyed. Over 5,700 fatalities. "
                          "One of India's worst natural disasters.",
        "peak_discharge_m3s": 11500,
        "source": "IMD / GSI / NDMA"
    },
    {
        "event_id": "EVT004",
        "title": "Gepang Gath Partial Breach",
        "location": "Himachal Pradesh, India",
        "state": "Himachal Pradesh",
        "date": "2022-07-25",
        "severity": "High",
        "impact_summary": "Partial moraine breach caused flash flooding along Chenab tributary. "
                          "No fatalities but significant damage to roads and bridges. "
                          "Emergency siphoning launched by NDRF/SDRF.",
        "peak_discharge_m3s": 850,
        "source": "CWC / HP State Disaster Mgmt"
    },
    {
        "event_id": "EVT005",
        "title": "Parechu Lake Breach",
        "location": "Himachal Pradesh, India",
        "state": "Himachal Pradesh",
        "date": "2005-06-26",
        "severity": "High",
        "impact_summary": "Landslide-dammed Parechu Lake breached, sending flood downstream into Spiti Valley. "
                          "Evacuation prevented fatalities. Controlled drainage channel built post-event.",
        "peak_discharge_m3s": 2300,
        "source": "CWC / GSI"
    },
    {
        "event_id": "EVT006",
        "title": "Dig Tsho GLOF",
        "location": "Khumbu, Nepal",
        "state": "Nepal",
        "date": "1985-08-04",
        "severity": "High",
        "impact_summary": "Ice-avalanche triggered GLOF from Dig Tsho lake in Langmoche Glacier region. "
                          "Destroyed Namche Bazar hydro plant. Volume released: ~5 million m³. "
                          "Peak discharge 1,600 m³/s.",
        "peak_discharge_m3s": 1600,
        "source": "ICIMOD / UNDP"
    },
    {
        "event_id": "EVT007",
        "title": "Luggye Tsho GLOF",
        "location": "Lunana, Bhutan",
        "state": "Bhutan",
        "date": "1994-10-07",
        "severity": "Critical",
        "impact_summary": "Moraine dam failure at Luggye Tsho released ~18 million m³ of water. "
                          "21 fatalities, massive destruction of farmland and infrastructure downstream. "
                          "One of the best-studied GLOF events globally.",
        "peak_discharge_m3s": 2900,
        "source": "Royal Government of Bhutan / ICIMOD"
    },
]
