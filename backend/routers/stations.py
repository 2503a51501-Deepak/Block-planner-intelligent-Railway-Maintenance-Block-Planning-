"""
Stations & Railway Sections Router for Block Planner.
Provides full CRUD for stations, junction classifications, and corridor sections.
"""
import re
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from database.session import get_connection
from models.domain import Station, RailwaySection

router = APIRouter(prefix="/api", tags=["Stations & Sections"])

VALID_STATION_TYPES = ["Major", "Junction", "Intermediate", "Terminal", "Halt"]

@router.get("/stations", response_model=List[Station])
def get_stations(
    search: Optional[str] = None,
    station_type: Optional[str] = None,
    division: Optional[str] = None,
    status: Optional[str] = None
):
    conn = get_connection()
    c = conn.cursor()
    query = "SELECT * FROM stations WHERE 1=1"
    params = []
    
    if search:
        query += " AND (station_code LIKE ? OR station_name LIKE ? OR location LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
    if station_type and station_type != "All":
        query += " AND station_type = ?"
        params.append(station_type)
    if division and division != "All":
        query += " AND division = ?"
        params.append(division)
    if status and status != "All":
        query += " AND status = ?"
        params.append(status)
        
    query += " ORDER BY station_name ASC"
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    return [Station(**dict(r)) for r in rows]

@router.get("/stations/{station_code}", response_model=Station)
def get_station_by_code(station_code: str):
    code = station_code.strip().upper()
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM stations WHERE UPPER(station_code) = ?", (code,))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail=f"Station with code '{code}' not found.")
    return Station(**dict(row))

@router.post("/stations", response_model=Station)
def create_station(station: Station):
    code = station.station_code.strip().upper() if station.station_code else ""
    name = station.station_name.strip() if station.station_name else ""
    
    # Validations
    if not code:
        raise HTTPException(status_code=400, detail="Station Code is required and cannot be empty.")
    if len(code) < 2 or len(code) > 10 or not re.match(r"^[A-Z0-9]+$", code):
        raise HTTPException(status_code=400, detail="Station Code must be 2-10 alphanumeric characters (e.g. SC, KZJ).")
    if not name:
        raise HTTPException(status_code=400, detail="Station Name is required and cannot be empty.")
    if station.station_type not in VALID_STATION_TYPES:
        raise HTTPException(status_code=400, detail=f"Station Type must be one of {VALID_STATION_TYPES}.")
    if station.platforms < 1 or station.platforms > 40:
        raise HTTPException(status_code=400, detail="Platforms count must be between 1 and 40.")
    if station.lines < 1 or station.lines > 60:
        raise HTTPException(status_code=400, detail="Lines count must be between 1 and 60.")

    station.station_code = code
    station.station_name = name

    conn = get_connection()
    c = conn.cursor()
    
    # Check duplicate
    c.execute("SELECT station_code FROM stations WHERE UPPER(station_code) = ?", (code,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Station with code '{code}' already exists.")

    try:
        c.execute("""
        INSERT INTO stations (
            station_code, station_name, station_type, division, zone,
            location, latitude, longitude, platforms, lines, electrified, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            code, name, station.station_type, station.division or "Secunderabad",
            station.zone or "South Central Railway", station.location or "",
            station.latitude, station.longitude, station.platforms, station.lines,
            station.electrified or "Yes", station.status or "Active"
        ))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Could not create station: {str(e)}")
    conn.close()
    return station

@router.put("/stations/{station_code}", response_model=Station)
def update_station(station_code: str, station: Station):
    code = station_code.strip().upper()
    name = station.station_name.strip() if station.station_name else ""
    
    if not name:
        raise HTTPException(status_code=400, detail="Station Name is required and cannot be empty.")
    if station.station_type not in VALID_STATION_TYPES:
        raise HTTPException(status_code=400, detail=f"Station Type must be one of {VALID_STATION_TYPES}.")
    if station.platforms < 1 or station.platforms > 40:
        raise HTTPException(status_code=400, detail="Platforms count must be between 1 and 40.")
    if station.lines < 1 or station.lines > 60:
        raise HTTPException(status_code=400, detail="Lines count must be between 1 and 60.")

    station.station_code = code
    station.station_name = name

    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT station_code FROM stations WHERE UPPER(station_code) = ?", (code,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Station with code '{code}' not found.")

    try:
        c.execute("""
        UPDATE stations SET
            station_name = ?, station_type = ?, division = ?, zone = ?,
            location = ?, latitude = ?, longitude = ?, platforms = ?,
            lines = ?, electrified = ?, status = ?
        WHERE UPPER(station_code) = ?
        """, (
            name, station.station_type, station.division or "Secunderabad",
            station.zone or "South Central Railway", station.location or "",
            station.latitude, station.longitude, station.platforms, station.lines,
            station.electrified or "Yes", station.status or "Active", code
        ))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
    conn.close()
    return station

@router.delete("/stations/{station_code}")
def delete_station(station_code: str):
    code = station_code.strip().upper()
    conn = get_connection()
    c = conn.cursor()
    
    # Check if station is referenced in active sections
    c.execute("""
    SELECT section_id FROM sections 
    WHERE UPPER(from_station) = ? OR UPPER(to_station) = ? 
       OR UPPER(from_code) = ? OR UPPER(to_code) = ?
    """, (code, code, code, code))
    active_sec = c.fetchall()
    if active_sec:
        sec_names = [dict(r)["section_id"] for r in active_sec]
        conn.close()
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete station '{code}' because it is referenced in corridor section(s): {', '.join(sec_names)}. Delete or update these sections first."
        )

    c.execute("DELETE FROM stations WHERE UPPER(station_code) = ?", (code,))
    conn.commit()
    conn.close()
    return {"message": f"Station '{code}' deleted successfully"}

# ----------------- RAILWAY SECTIONS -----------------

@router.get("/sections", response_model=List[RailwaySection])
def get_sections(status: Optional[str] = None):
    conn = get_connection()
    c = conn.cursor()
    query = "SELECT * FROM sections WHERE 1=1"
    params = []
    if status and status != "All":
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY section_id ASC"
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    return [RailwaySection(**dict(r)) for r in rows]

@router.post("/sections", response_model=RailwaySection)
def create_section(sec: RailwaySection):
    sec_id = sec.section_id.strip().upper() if sec.section_id else ""
    from_st = sec.from_station.strip() if sec.from_station else ""
    to_st = sec.to_station.strip() if sec.to_station else ""

    if not sec_id:
        raise HTTPException(status_code=400, detail="Section ID is required and cannot be empty.")
    if not from_st or not to_st:
        raise HTTPException(status_code=400, detail="Both 'From Station' and 'To Station' are required.")
    if from_st.lower() == to_st.lower():
        raise HTTPException(status_code=400, detail="From Station and To Station cannot be the same.")
    if sec.distance_km <= 0.0 or sec.distance_km > 2000.0:
        raise HTTPException(status_code=400, detail="Distance must be greater than 0 km and realistic (<= 2000 km).")
    if sec.tracks_count < 1 or sec.tracks_count > 10:
        raise HTTPException(status_code=400, detail="Tracks count must be between 1 and 10.")
    if sec.max_speed_kmh < 30 or sec.max_speed_kmh > 250:
        raise HTTPException(status_code=400, detail="Max Speed must be between 30 and 250 km/h.")
    if sec.permitted_block_duration <= 0.0 or sec.permitted_block_duration > 12.0:
        raise HTTPException(status_code=400, detail="Permitted Block Duration must be between 0.5 and 12.0 hours.")

    sec.section_id = sec_id
    sec.from_station = from_st
    sec.to_station = to_st

    conn = get_connection()
    c = conn.cursor()
    
    # Check duplicate
    c.execute("SELECT section_id FROM sections WHERE UPPER(section_id) = ?", (sec_id,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Railway section with ID '{sec_id}' already exists.")

    try:
        c.execute("""
        INSERT INTO sections (
            section_id, from_station, to_station, distance_km, tracks_count,
            electrified, max_speed_kmh, permitted_block_duration, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sec_id, from_st, to_st, sec.distance_km,
            sec.tracks_count, sec.electrified or "Yes", sec.max_speed_kmh,
            sec.permitted_block_duration, sec.status or "Active"
        ))
        
        # Seed default operational block slots
        dates = ["2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05"]
        for d in dates:
            c.execute("""
            INSERT OR IGNORE INTO block_availability (
                block_id, section, date, start_time, end_time, duration_hours,
                line_type, max_permitted_duration_hours, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (f"BLK-{sec_id}-{d}-AFT", sec_id, d, "13:00", "15:00", 2.0, "Up Main", sec.permitted_block_duration, "Available"))
            c.execute("""
            INSERT OR IGNORE INTO block_availability (
                block_id, section, date, start_time, end_time, duration_hours,
                line_type, max_permitted_duration_hours, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (f"BLK-{sec_id}-{d}-NGT", sec_id, d, "01:30", "04:30", 3.0, "Both Lines", sec.permitted_block_duration, "Available"))

        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Could not create section: {str(e)}")
    conn.close()
    return sec

@router.put("/sections/{section_id}", response_model=RailwaySection)
def update_section(section_id: str, sec: RailwaySection):
    sec_id = section_id.strip().upper()
    from_st = sec.from_station.strip() if sec.from_station else ""
    to_st = sec.to_station.strip() if sec.to_station else ""

    if not from_st or not to_st:
        raise HTTPException(status_code=400, detail="Both 'From Station' and 'To Station' are required.")
    if from_st.lower() == to_st.lower():
        raise HTTPException(status_code=400, detail="From Station and To Station cannot be the same.")
    if sec.distance_km <= 0.0 or sec.distance_km > 2000.0:
        raise HTTPException(status_code=400, detail="Distance must be greater than 0 km and realistic (<= 2000 km).")
    if sec.tracks_count < 1 or sec.tracks_count > 10:
        raise HTTPException(status_code=400, detail="Tracks count must be between 1 and 10.")
    if sec.max_speed_kmh < 30 or sec.max_speed_kmh > 250:
        raise HTTPException(status_code=400, detail="Max Speed must be between 30 and 250 km/h.")
    if sec.permitted_block_duration <= 0.0 or sec.permitted_block_duration > 12.0:
        raise HTTPException(status_code=400, detail="Permitted Block Duration must be between 0.5 and 12.0 hours.")

    sec.section_id = sec_id
    sec.from_station = from_st
    sec.to_station = to_st

    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT section_id FROM sections WHERE UPPER(section_id) = ?", (sec_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Section with ID '{sec_id}' not found.")

    try:
        c.execute("""
        UPDATE sections SET
            from_station = ?, to_station = ?, distance_km = ?, tracks_count = ?,
            electrified = ?, max_speed_kmh = ?, permitted_block_duration = ?, status = ?
        WHERE UPPER(section_id) = ?
        """, (
            from_st, to_st, sec.distance_km, sec.tracks_count,
            sec.electrified or "Yes", sec.max_speed_kmh, sec.permitted_block_duration,
            sec.status or "Active", sec_id
        ))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
    conn.close()
    return sec

@router.delete("/sections/{section_id}")
def delete_section(section_id: str):
    sec_id = section_id.strip().upper()
    conn = get_connection()
    c = conn.cursor()
    
    # Check if active tasks exist on section
    c.execute("SELECT COUNT(*) as cnt FROM maintenance_tasks WHERE section = ? AND status != 'Completed'", (sec_id,))
    cnt_tasks = c.fetchone()["cnt"]
    if cnt_tasks > 0:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete section '{sec_id}' because {cnt_tasks} pending maintenance task(s) are assigned to it."
        )

    c.execute("DELETE FROM sections WHERE UPPER(section_id) = ?", (sec_id,))
    c.execute("DELETE FROM block_availability WHERE UPPER(section) = ?", (sec_id,))
    conn.commit()
    conn.close()
    return {"message": f"Section '{sec_id}' deleted successfully"}
