"""
Data Import / Export and Reset Router for RailOpt-AI.
Supports CSV uploads, sample template generation, and database reset.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import PlainTextResponse
from typing import Optional
from database.session import get_connection
from seed.seed_data import seed_database
import csv
import io

router = APIRouter(prefix="/api", tags=["Data Import & Export"])

SAMPLE_CSV_TEMPLATES = {
    "maintenance": """task_id,department,asset_id,section,location,task_type,description,severity,asset_criticality,due_date,overdue_days,estimated_duration_hours,required_team,status,requires_power_block,requires_traffic_block
TMS-101,Engineering,TRK-SEC-099,SEC-KZJ,Km 99/10-14,USFD Flaw,Micro flaw detected on mainline,Critical,Critical,2026-08-30,2,2.0,P-Way Gang 01,Overdue,0,1
TDMS-102,Traction,OHE-SEC-101,SEC-KZJ,Km 101/02-06,Insulator Swap,Flashover mark on insulator,High,High,2026-08-30,1,1.5,TRD Tower Wagon Unit A,Pending,1,1
SMMS-103,Signal & Telecom,SIG-SEC-102,SEC-KZJ,Jangaon Point 12A,Point Motor Overhaul,Excess friction timing,High,High,2026-08-30,0,1.0,S&T Signal Team 01,Pending,0,1""",

    "trains": """train_id,train_number,train_name,train_type,section,arrival_time,departure_time,priority,expected
TRN-101,20601,Vande Bharat Express,Express,SEC-KZJ,06:00,07:15,1,On Time
TRN-102,12727,Godavari Superfast Exp,Express,SEC-KZJ,17:15,18:40,2,On Time
TRN-103,G-BCN-99,Coal Rake BCN #99,Goods,SEC-KZJ,02:00,04:30,4,On Time""",

    "goods_forecast": """forecast_id,section,expected_start_time,expected_end_time,probability,traffic_level
GF-101,SEC-KZJ,01:00,05:00,0.85,High
GF-102,WL-BZA,13:00,15:30,0.25,Low""",

    "blocks": """block_id,section,date,start_time,end_time,maximum_duration,status
BLK-101,WL-BZA,2026-08-30,13:00,15:00,2.0,Available
BLK-102,SEC-KZJ,2026-08-30,11:30,14:00,2.5,Available"""
}

@router.get("/samples/{entity}", response_class=PlainTextResponse)
def get_sample_csv(entity: str):
    template = SAMPLE_CSV_TEMPLATES.get(entity.lower())
    if not template:
        raise HTTPException(status_code=404, detail="Sample template not found")
    return template

@router.post("/import")
async def import_csv_data(
    entity_type: str = Form(...),
    file: UploadFile = File(...)
):
    contents = await file.read()
    text = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    
    conn = get_connection()
    c = conn.cursor()
    imported_count = 0

    try:
        if entity_type == "maintenance":
            for row in reader:
                c.execute("""
                INSERT OR REPLACE INTO maintenance_tasks (
                    task_id, department, asset_id, section, location, task_type,
                    description, severity, asset_criticality, due_date, overdue_days,
                    estimated_duration_hours, required_team, status, requires_power_block,
                    requires_traffic_block, priority_score, priority_level
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 'Medium')
                """, (
                    row["task_id"], row["department"], row["asset_id"], row["section"],
                    row["location"], row["task_type"], row["description"], row["severity"],
                    row["asset_criticality"], row["due_date"], int(row.get("overdue_days", 0)),
                    float(row["estimated_duration_hours"]), row["required_team"],
                    row.get("status", "Pending"), int(row.get("requires_power_block", 0)),
                    int(row.get("requires_traffic_block", 1))
                ))
                imported_count += 1

        elif entity_type == "trains":
            for row in reader:
                c.execute("""
                INSERT OR REPLACE INTO trains (
                    train_id, train_number, train_name, train_type, section,
                    arrival_time, departure_time, priority, expected
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    row["train_id"], row["train_number"], row["train_name"], row["train_type"],
                    row["section"], row["arrival_time"], row["departure_time"],
                    int(row.get("priority", 2)), row.get("expected", "On Time")
                ))
                imported_count += 1

        elif entity_type == "blocks":
            for row in reader:
                c.execute("""
                INSERT OR REPLACE INTO block_availability (
                    block_id, section, date, start_time, end_time, maximum_duration, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    row["block_id"], row["section"], row["date"], row["start_time"],
                    row["end_time"], float(row["maximum_duration"]), row.get("status", "Available")
                ))
                imported_count += 1
                
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    conn.close()
    return {"success": True, "imported_count": imported_count, "entity_type": entity_type}

@router.post("/reset-demo")
def reset_demo_data():
    seed_database()
    return {"success": True, "message": "Simulated railway database reset to default demo scenario."}
