"""
Trains & Timetable Router for Block Planner.
Provides full CRUD for trains and timetable management with time validation.
"""
import re
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from database.session import get_connection
from models.domain import Train, GoodsForecast

router = APIRouter(prefix="/api/trains", tags=["Trains & Timetable"])

VALID_TRAIN_TYPES = ["Express", "Superfast", "Passenger", "MEMU", "DEMU", "Goods", "Special"]
VALID_RUNNING_STATUS = ["Scheduled", "Delayed", "Cancelled", "Completed"]

def validate_time_str(t_str: str, field_name: str = "Time"):
    if not t_str or not isinstance(t_str, str):
        raise HTTPException(status_code=400, detail=f"{field_name} is required and must be in HH:MM format.")
    match = re.match(r"^([01]\d|2[0-3]):([0-5]\d)$", t_str.strip())
    if not match:
        raise HTTPException(status_code=400, detail=f"{field_name} '{t_str}' is invalid. Must be in 24-hour HH:MM format (00:00 to 23:59).")
    h, m = int(match.group(1)), int(match.group(2))
    return h * 60 + m

@router.get("", response_model=List[Train])
def get_trains(
    section: Optional[str] = None,
    train_type: Optional[str] = None,
    priority: Optional[int] = None,
    running_status: Optional[str] = None,
    search: Optional[str] = None
):
    conn = get_connection()
    c = conn.cursor()
    query = "SELECT * FROM trains WHERE 1=1"
    params = []
    
    if search:
        query += " AND (train_number LIKE ? OR train_name LIKE ? OR origin_station LIKE ? OR destination_station LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])
    if section and section != "All":
        query += " AND section = ?"
        params.append(section)
    if train_type and train_type != "All":
        query += " AND train_type = ?"
        params.append(train_type)
    if priority:
        query += " AND priority = ?"
        params.append(priority)
    if running_status and running_status != "All":
        query += " AND running_status = ?"
        params.append(running_status)
        
    query += " ORDER BY arrival_time ASC"
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    return [Train(**dict(r)) for r in rows]

@router.get("/{train_id}", response_model=Train)
def get_train_by_id(train_id: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM trains WHERE train_id = ?", (train_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail=f"Train with ID '{train_id}' not found.")
    return Train(**dict(row))

@router.post("", response_model=Train)
def create_train(train: Train):
    t_num = train.train_number.strip() if train.train_number else ""
    t_name = train.train_name.strip() if train.train_name else ""
    sec = train.section.strip().upper() if train.section else ""

    if not t_num:
        raise HTTPException(status_code=400, detail="Train Number is required.")
    if not t_name:
        raise HTTPException(status_code=400, detail="Train Name is required.")
    if not sec:
        raise HTTPException(status_code=400, detail="Railway Section is required.")

    # Time validation
    arr_m = validate_time_str(train.arrival_time, "Arrival Time")
    dep_m = validate_time_str(train.departure_time, "Departure Time")

    # Check same-day sequence (if dep is before arr, warn or check overnight)
    if dep_m < arr_m:
        raise HTTPException(
            status_code=400, 
            detail=f"Departure Time ({train.departure_time}) cannot be earlier than Arrival Time ({train.arrival_time}) for the same section service."
        )

    # Priority mapping
    if train.priority not in [1, 2, 3, 4]:
        train.priority = 2
    if train.priority == 1:
        train.priority_label = "Critical"
    elif train.priority == 2:
        train.priority_label = "High"
    elif train.priority == 3:
        train.priority_label = "Medium"
    else:
        train.priority_label = "Low"

    # Train Type & Running Status
    if train.train_type not in VALID_TRAIN_TYPES:
        train.train_type = "Express"
    if train.running_status not in VALID_RUNNING_STATUS:
        train.running_status = "Scheduled"

    # Auto-assign ID if missing
    if not train.train_id or train.train_id.strip() == "":
        train.train_id = f"TRN-{t_num}"
    else:
        train.train_id = train.train_id.strip()

    train.train_number = t_num
    train.train_name = t_name
    train.section = sec

    conn = get_connection()
    c = conn.cursor()
    
    # Check duplicate train_id
    c.execute("SELECT train_id FROM trains WHERE train_id = ?", (train.train_id,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Train with ID '{train.train_id}' already exists.")

    try:
        c.execute("""
        INSERT INTO trains (
            train_id, train_number, train_name, train_type, origin_station,
            destination_station, section, arrival_time, departure_time, date,
            priority, priority_label, direction, running_status, expected, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            train.train_id, train.train_number, train.train_name, train.train_type,
            train.origin_station or "Secunderabad", train.destination_station or "Vijayawada",
            train.section, train.arrival_time, train.departure_time, train.date or "2026-08-30",
            train.priority, train.priority_label, train.direction or "Down",
            train.running_status, train.expected or "On Time", train.remarks or ""
        ))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Could not create train: {str(e)}")
    conn.close()
    return train

@router.put("/{train_id}", response_model=Train)
def update_train(train_id: str, train: Train):
    t_num = train.train_number.strip() if train.train_number else ""
    t_name = train.train_name.strip() if train.train_name else ""
    sec = train.section.strip().upper() if train.section else ""

    if not t_num or not t_name or not sec:
        raise HTTPException(status_code=400, detail="Train Number, Name, and Section are required.")

    arr_m = validate_time_str(train.arrival_time, "Arrival Time")
    dep_m = validate_time_str(train.departure_time, "Departure Time")

    if dep_m < arr_m:
        raise HTTPException(
            status_code=400, 
            detail=f"Departure Time ({train.departure_time}) cannot be earlier than Arrival Time ({train.arrival_time})."
        )

    if train.priority == 1:
        train.priority_label = "Critical"
    elif train.priority == 2:
        train.priority_label = "High"
    elif train.priority == 3:
        train.priority_label = "Medium"
    else:
        train.priority_label = "Low"

    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT train_id FROM trains WHERE train_id = ?", (train_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Train with ID '{train_id}' not found.")

    try:
        c.execute("""
        UPDATE trains SET
            train_number = ?, train_name = ?, train_type = ?, origin_station = ?,
            destination_station = ?, section = ?, arrival_time = ?, departure_time = ?,
            date = ?, priority = ?, priority_label = ?, direction = ?,
            running_status = ?, expected = ?, remarks = ?
        WHERE train_id = ?
        """, (
            t_num, t_name, train.train_type or "Express",
            train.origin_station or "Secunderabad", train.destination_station or "Vijayawada",
            sec, train.arrival_time, train.departure_time, train.date or "2026-08-30",
            train.priority, train.priority_label, train.direction or "Down",
            train.running_status or "Scheduled", train.expected or "On Time",
            train.remarks or "", train_id
        ))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
    conn.close()
    return train

@router.delete("/{train_id}")
def delete_train(train_id: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM trains WHERE train_id = ?", (train_id,))
    conn.commit()
    conn.close()
    return {"message": f"Train '{train_id}' deleted successfully"}

@router.get("/goods-forecast", response_model=List[GoodsForecast])
def get_goods_forecast(section: Optional[str] = None):
    conn = get_connection()
    c = conn.cursor()
    query = "SELECT * FROM goods_forecasts WHERE 1=1"
    params = []
    if section and section != "All":
        query += " AND section = ?"
        params.append(section)
    query += " ORDER BY expected_start_time ASC"
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    return [GoodsForecast(**dict(r)) for r in rows]
