"""
Block Availability, Manual Planning, and Validation Router for Block Planner.
"""
import re
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from database.session import get_connection
from models.domain import BlockAvailability, ManualBlockRequest, RecommendedBlock, MaintenanceTask, Train, GoodsForecast
from optimizer.conflicts import analyze_block_conflicts, time_to_minutes
from routers.tasks import row_to_task
import json

router = APIRouter(prefix="/api/blocks", tags=["Block Availability & Manual Planning"])

def validate_time_str(t_str: str, field_name: str = "Time") -> int:
    if not t_str or not isinstance(t_str, str):
        raise HTTPException(status_code=400, detail=f"{field_name} is required and must be in HH:MM format.")
    match = re.match(r"^([01]\d|2[0-3]):([0-5]\d)$", t_str.strip())
    if not match:
        raise HTTPException(status_code=400, detail=f"{field_name} '{t_str}' is invalid. Must be in 24-hour HH:MM format (00:00 to 23:59).")
    h, m = int(match.group(1)), int(match.group(2))
    return h * 60 + m

@router.get("", response_model=List[BlockAvailability])
def get_blocks(
    section: Optional[str] = None,
    date: Optional[str] = None,
    status: Optional[str] = None
):
    conn = get_connection()
    c = conn.cursor()
    query = "SELECT * FROM block_availability WHERE 1=1"
    params = []
    if section and section != "All":
        query += " AND section = ?"
        params.append(section)
    if date:
        query += " AND date = ?"
        params.append(date)
    if status and status != "All":
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY date ASC, start_time ASC"
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    return [BlockAvailability(**dict(r)) for r in rows]

@router.post("", response_model=BlockAvailability)
def create_block(block: BlockAvailability):
    validate_time_str(block.start_time, "Start Time")
    validate_time_str(block.end_time, "End Time")

    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("""
        INSERT INTO block_availability (
            block_id, section, date, start_time, end_time, duration_hours,
            line_type, max_permitted_duration_hours, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            block.block_id, block.section, block.date, block.start_time,
            block.end_time, block.duration_hours, block.line_type,
            block.max_permitted_duration_hours, block.status
        ))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Could not create block slot: {str(e)}")
    conn.close()
    return block

@router.post("/validate")
def validate_manual_block(req: ManualBlockRequest):
    sec = req.section.strip().upper() if req.section else ""
    if not sec:
        return {
            "is_feasible": False,
            "duration_hours": 0.0,
            "conflicts": ["Railway section is required."],
            "warnings": [],
            "train_impact_score": 100.0,
            "affected_trains": []
        }

    try:
        start_m = validate_time_str(req.start_time, "Start Time")
        end_m = validate_time_str(req.end_time, "End Time")
    except HTTPException as e:
        return {
            "is_feasible": False,
            "duration_hours": 0.0,
            "conflicts": [e.detail],
            "warnings": [],
            "train_impact_score": 100.0,
            "affected_trains": []
        }

    duration_hours = (end_m - start_m) / 60.0
    if duration_hours <= 0:
        return {
            "is_feasible": False,
            "duration_hours": 0.0,
            "conflicts": ["End Time must be later than Start Time on the same day."],
            "warnings": [],
            "train_impact_score": 100.0,
            "affected_trains": []
        }

    conn = get_connection()
    c = conn.cursor()
    
    # 1. Fetch trains for section
    c.execute("SELECT * FROM trains WHERE section = ?", (sec,))
    train_rows = c.fetchall()
    train_objs = [Train(**dict(tr)) for tr in train_rows]
        
    # 2. Fetch forecasts
    c.execute("SELECT * FROM goods_forecasts WHERE section = ?", (sec,))
    gf_rows = c.fetchall()
    gf_objs = [GoodsForecast(**dict(gf)) for gf in gf_rows]
    
    # 3. Fetch tasks
    tasks = []
    missing_tasks = []
    wrong_sec_tasks = []
    if req.task_ids:
        for tid in req.task_ids:
            c.execute("SELECT * FROM maintenance_tasks WHERE task_id = ?", (tid,))
            row = c.fetchone()
            if not row:
                missing_tasks.append(tid)
            else:
                tsk = row_to_task(row)
                if tsk.section.upper() != sec:
                    wrong_sec_tasks.append(f"{tid} (assigned to {tsk.section})")
                else:
                    tasks.append(tsk)
            
    conn.close()

    conflicts = []
    warnings = []
    is_feasible = True

    if missing_tasks:
        conflicts.append(f"Task(s) not found in system: {', '.join(missing_tasks)}.")
        is_feasible = False

    if wrong_sec_tasks:
        conflicts.append(f"Task(s) belong to different section: {', '.join(wrong_sec_tasks)}.")
        is_feasible = False

    # Check task durations
    for t in tasks:
        if t.estimated_duration_hours > duration_hours:
            conflicts.append(
                f"Task '{t.task_id}' ({t.task_type}) duration requirement ({t.estimated_duration_hours}h) exceeds proposed block window ({duration_hours}h)."
            )
            is_feasible = False

    # Run train conflict analysis
    conflict_res = analyze_block_conflicts(
        section=sec,
        start_time=req.start_time,
        end_time=req.end_time,
        trains=train_objs,
        goods_forecasts=gf_objs,
        tolerance="Medium"
    )

    if conflict_res["has_hard_safety_conflict"]:
        is_feasible = False
        for at in conflict_res["affected_trains"]:
            if at.get("priority") == 1:
                conflicts.append(
                    f"SAFETY VIOLATION: Overlaps with Protected Priority 1 train {at['train_number']} ({at['train_name']}) ({at.get('overlap_minutes', 0)} min overlap)."
                )

    for at in conflict_res["affected_trains"]:
        if at.get("priority") != 1:
            warnings.append(
                f"Delay risk for Train {at['train_number']} ({at['train_name']}) with {at.get('overlap_minutes', 0)} min overlap (Penalty score: {at.get('impact_penalty', 0)})."
            )

    # Check team conflicts
    teams = [t.required_team for t in tasks if t.required_team]
    if len(teams) != len(set(teams)):
        warnings.append("Multiple selected tasks share the same maintenance gang; tasks must be sequenced.")

    return {
        "is_feasible": is_feasible,
        "duration_hours": round(duration_hours, 2),
        "conflicts": conflicts,
        "warnings": warnings,
        "train_impact_score": conflict_res.get("train_impact_score", 0.0),
        "affected_trains": conflict_res.get("affected_trains", [])
    }

@router.post("/manual", response_model=RecommendedBlock)
def create_manual_block(req: ManualBlockRequest):
    val_res = validate_manual_block(req)
    if not val_res["is_feasible"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot schedule infeasible block: {'; '.join(val_res['conflicts'])}"
        )

    conn = get_connection()
    c = conn.cursor()
    
    # Load task details
    tasks = []
    if req.task_ids:
        for tid in req.task_ids:
            c.execute("SELECT * FROM maintenance_tasks WHERE task_id = ?", (tid,))
            row = c.fetchone()
            if row:
                tasks.append(row_to_task(row))

    depts = list(set([t.department for t in tasks])) if tasks else ["Engineering"]

    import uuid
    rec_id = f"MAN-BLK-{uuid.uuid4().hex[:6].upper()}"

    reasons = [
        f"Manually created maintenance block by controller for section {req.section}",
        f"Allocated {val_res['duration_hours']}h window ({req.start_time} - {req.end_time})",
        f"Bundles {len(tasks)} maintenance task(s) across {len(depts)} department(s)",
        f"Train impact score: {val_res['train_impact_score']:.1f}/100"
    ]
    if req.remarks:
        reasons.append(f"Remarks: {req.remarks}")

    # Build response model
    rec = RecommendedBlock(
        recommendation_id=rec_id,
        section=req.section,
        date=req.date or "2026-08-30",
        start_time=req.start_time,
        end_time=req.end_time,
        duration_hours=val_res["duration_hours"],
        departments=depts,
        tasks=tasks,
        affected_trains=val_res["affected_trains"],
        train_impact_score=val_res["train_impact_score"],
        reasons=reasons,
        status="Accepted",
        created_at="2026-08-30T10:00:00Z"
    )

    # Persist in SQLite
    try:
        tasks_json = json.dumps([t.dict() for t in tasks])
        trains_json = json.dumps(val_res["affected_trains"])
        depts_json = json.dumps(depts)
        reasons_json = json.dumps(reasons)
        
        c.execute("""
        INSERT OR REPLACE INTO recommended_blocks (
            recommendation_id, section, date, start_time, end_time, duration_hours,
            departments, tasks, affected_trains, train_impact_score, reasons, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rec.recommendation_id, rec.section, rec.date, rec.start_time,
            rec.end_time, rec.duration_hours, depts_json, tasks_json,
            trains_json, rec.train_impact_score, reasons_json, "Accepted"
        ))
        
        # Mark tasks In-Progress or Allocated
        for t in tasks:
            c.execute("UPDATE maintenance_tasks SET status = 'In-Progress' WHERE task_id = ?", (t.task_id,))

        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Could not persist manual block: {str(e)}")
        
    conn.close()
    return rec
